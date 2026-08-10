"""
AI Router — 5-provider fallback chain for LeadFlowX.

Routing strategy:
  1. Cerebras  — heavy context parsing, query generation  (1M tokens/day)
  2. Groq      — fast extraction, classification           (14.4K req/day)
  3. Mistral   — bulk lead scoring, reasoning              (1B tokens/mo)
  4. CF Workers AI — cheap edge fallback                   (10K neurons/day)
  5. Ollama    — emergency local fallback (rare)

All providers are free-tier / no-CC. The router tracks usage per provider
per day and automatically falls through on rate-limit or error.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from datetime import date, datetime
from enum import Enum
from typing import Optional

import httpx

def _load_env_local():
    for env_path in [
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local"),
        "c:/Users/sarthak shavarn/OneDrive/Desktop/New folder/Linkedout/.env.local",
    ]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            if k.strip() not in os.environ:
                                os.environ[k.strip()] = v.strip().strip('"').strip("'")
            except Exception:
                pass

_load_env_local()

logger = logging.getLogger("ai_router")
logger.setLevel(logging.INFO)

# ---------------------------------------------------------------------------
# Task types — determine which provider is tried first
# ---------------------------------------------------------------------------

class TaskType(Enum):
    PARSE_CONTEXT = "parse_context"       # Heavy → Cerebras first
    GENERATE_QUERY = "generate_query"     # Heavy → Cerebras first
    EXTRACT_DATA = "extract_data"         # Fast  → Groq first
    SCORE_LEADS = "score_leads"           # Bulk  → Mistral first
    CLASSIFY = "classify"                 # Fast  → Groq first
    GENERAL = "general"                   # Any


# ---------------------------------------------------------------------------
# Provider usage tracking (in-memory, flushed to Supabase periodically)
# ---------------------------------------------------------------------------

class ProviderUsage:
    """Tracks tokens/requests per provider per day in memory."""

    def __init__(self):
        self._data: dict[str, dict] = {}
        self._today: str = str(date.today())

    def _ensure_provider(self, provider: str) -> dict:
        today = str(date.today())
        if today != self._today:
            # New day → reset all counters
            self._data.clear()
            self._today = today
        if provider not in self._data:
            self._data[provider] = {
                "tokens_used": 0,
                "requests_made": 0,
                "errors": 0,
                "latencies": [],
            }
        return self._data[provider]

    def record_success(self, provider: str, tokens: int, latency_ms: int):
        d = self._ensure_provider(provider)
        d["tokens_used"] += tokens
        d["requests_made"] += 1
        d["latencies"].append(latency_ms)

    def record_error(self, provider: str, error_msg: str):
        d = self._ensure_provider(provider)
        d["errors"] += 1
        d["last_error"] = error_msg

    def get_usage(self, provider: str) -> dict:
        return self._ensure_provider(provider)

    def to_dict(self) -> dict:
        return {p: {k: v for k, v in d.items() if k != "latencies"} | {
            "avg_latency_ms": int(sum(d["latencies"]) / len(d["latencies"])) if d["latencies"] else 0
        } for p, d in self._data.items()}


# Singleton usage tracker
_usage = ProviderUsage()


# ---------------------------------------------------------------------------
# Provider limits (daily)
# ---------------------------------------------------------------------------

PROVIDER_LIMITS = {
    "cerebras": {"tokens_per_day": 1_000_000, "requests_per_day": 50_000},
    "groq": {"tokens_per_day": 500_000, "requests_per_day": 14_400},
    "mistral": {"tokens_per_day": 33_000_000, "requests_per_day": 100_000},
    "cloudflare_ai": {"tokens_per_day": 100_000, "requests_per_day": 10_000},
    "ollama": {"tokens_per_day": float("inf"), "requests_per_day": float("inf")},
}


# ---------------------------------------------------------------------------
# Task → Provider priority mapping
# ---------------------------------------------------------------------------

TASK_PRIORITY = {
    TaskType.PARSE_CONTEXT:  ["cerebras", "mistral", "groq", "cloudflare_ai", "ollama"],
    TaskType.GENERATE_QUERY: ["cerebras", "groq", "mistral", "cloudflare_ai", "ollama"],
    TaskType.EXTRACT_DATA:   ["groq", "cerebras", "mistral", "cloudflare_ai", "ollama"],
    TaskType.SCORE_LEADS:    ["mistral", "cerebras", "groq", "cloudflare_ai", "ollama"],
    TaskType.CLASSIFY:       ["groq", "cerebras", "mistral", "cloudflare_ai", "ollama"],
    TaskType.GENERAL:        ["cerebras", "groq", "mistral", "cloudflare_ai", "ollama"],
}


# ---------------------------------------------------------------------------
# Individual provider callers
# ---------------------------------------------------------------------------

async def _call_cerebras(prompt: str, system_prompt: str = "") -> tuple[str, int]:
    """Call Cerebras API (llama-3.3-70b or llama-3.1-8b-instant)."""
    api_key = os.environ.get("CEREBRAS_API_KEY", "")
    if not api_key:
        raise ValueError("CEREBRAS_API_KEY not set")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.cerebras.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "llama-3.3-70b", "messages": messages, "max_tokens": 2048, "temperature": 0.3},
        )
        if resp.status_code == 429:
            raise RateLimitError("cerebras", resp.text)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", len(content) // 4)
        return content, tokens


async def _call_groq(prompt: str, system_prompt: str = "") -> tuple[str, int]:
    """Call Groq API (llama-3.1-8b-instant)."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "llama-3.1-8b-instant", "messages": messages, "max_tokens": 2048, "temperature": 0.3},
        )
        if resp.status_code == 429:
            raise RateLimitError("groq", resp.text)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", len(content) // 4)
        return content, tokens


async def _call_mistral(prompt: str, system_prompt: str = "") -> tuple[str, int]:
    """Call Mistral API (mistral-small-latest)."""
    api_key = os.environ.get("MISTRAL_API_KEY", "")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not set")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "mistral-small-latest", "messages": messages, "max_tokens": 2048, "temperature": 0.3},
        )
        if resp.status_code == 429:
            raise RateLimitError("mistral", resp.text)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        tokens = data.get("usage", {}).get("total_tokens", len(content) // 4)
        return content, tokens


async def _call_cloudflare_ai(prompt: str, system_prompt: str = "") -> tuple[str, int]:
    """Call Cloudflare Workers AI via the Worker HTTP endpoint."""
    worker_url = os.environ.get("CF_WORKER_URL", "")
    if not worker_url:
        raise ValueError("CF_WORKER_URL not set")

    payload = {"prompt": prompt}
    if system_prompt:
        payload["system_prompt"] = system_prompt

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{worker_url.rstrip('/')}/api/ai/infer",
            json=payload,
        )
        if resp.status_code == 429:
            raise RateLimitError("cloudflare_ai", resp.text)
        resp.raise_for_status()
        data = resp.json()
        content = data.get("result", "")
        tokens = len(content) // 4  # estimate
        return content, tokens


async def _call_ollama(prompt: str, system_prompt: str = "") -> tuple[str, int]:
    """Call Ollama local LLM (emergency fallback — only on Modal with GPU)."""
    ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{ollama_url}/api/chat",
            json={"model": "llama3.2:3b", "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        data = resp.json()
        content = data.get("message", {}).get("content", "")
        tokens = data.get("eval_count", len(content) // 4)
        return content, tokens


# ---------------------------------------------------------------------------
# Provider dispatch table
# ---------------------------------------------------------------------------

PROVIDER_CALLERS = {
    "cerebras": _call_cerebras,
    "groq": _call_groq,
    "mistral": _call_mistral,
    "cloudflare_ai": _call_cloudflare_ai,
    "ollama": _call_ollama,
}


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class RateLimitError(Exception):
    def __init__(self, provider: str, detail: str = ""):
        self.provider = provider
        self.detail = detail
        super().__init__(f"Rate limit hit on {provider}: {detail}")


class AllProvidersExhaustedError(Exception):
    pass


# ---------------------------------------------------------------------------
# Main router function
# ---------------------------------------------------------------------------

async def call_ai(
    prompt: str,
    task: TaskType = TaskType.GENERAL,
    system_prompt: str = "",
    max_retries: int = 1,
) -> str:
    """
    Route an AI call through the provider chain based on task type.
    Automatically falls through to next provider on rate-limit or error.

    Returns the AI response text.
    Raises AllProvidersExhaustedError if every provider fails.
    """
    providers = TASK_PRIORITY.get(task, TASK_PRIORITY[TaskType.GENERAL])
    last_error: Optional[Exception] = None

    for provider_name in providers:
        # Check if provider has headroom
        usage = _usage.get_usage(provider_name)
        limits = PROVIDER_LIMITS[provider_name]
        if usage["requests_made"] >= limits["requests_per_day"]:
            logger.warning(f"Skipping {provider_name}: daily request limit reached ({usage['requests_made']})")
            continue
        if usage["tokens_used"] >= limits["tokens_per_day"]:
            logger.warning(f"Skipping {provider_name}: daily token limit reached ({usage['tokens_used']})")
            continue

        caller = PROVIDER_CALLERS[provider_name]
        for attempt in range(max_retries + 1):
            try:
                start = time.monotonic()
                content, tokens = await caller(prompt, system_prompt)
                latency = int((time.monotonic() - start) * 1000)

                _usage.record_success(provider_name, tokens, latency)
                logger.info(f"✅ {provider_name} responded in {latency}ms ({tokens} tokens)")
                return content

            except RateLimitError as e:
                _usage.record_error(provider_name, str(e))
                logger.warning(f"⚠️ {provider_name} rate limited: {e}")
                last_error = e
                break  # skip to next provider

            except Exception as e:
                _usage.record_error(provider_name, str(e))
                logger.warning(f"⚠️ {provider_name} error (attempt {attempt + 1}): {e}")
                last_error = e
                if attempt < max_retries:
                    await asyncio.sleep(1 * (attempt + 1))  # backoff
                continue

    raise AllProvidersExhaustedError(
        f"All AI providers exhausted. Last error: {last_error}"
    )


# ---------------------------------------------------------------------------
# Utility: structured JSON extraction
# ---------------------------------------------------------------------------

async def call_ai_json(
    prompt: str,
    task: TaskType = TaskType.GENERAL,
    system_prompt: str = "",
) -> dict | list:
    """Call AI and parse the response as JSON. Strips markdown fences if present."""
    raw = await call_ai(prompt, task, system_prompt)

    # Strip markdown code fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last lines (fences)
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON in the response
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = cleaned.find(start_char)
            end = cleaned.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end + 1])
                except json.JSONDecodeError:
                    continue
        raise ValueError(f"Could not parse AI response as JSON: {raw[:200]}")


# ---------------------------------------------------------------------------
# Get current usage stats (for monitoring / Supabase flush)
# ---------------------------------------------------------------------------

def get_usage_stats() -> dict:
    """Return current usage stats for all providers."""
    return _usage.to_dict()


def get_ai_provider_health() -> dict[str, str]:
    """Check AI provider availability without exposing secret keys (Requirement A)."""
    health = {
        "cerebras": "configured" if os.environ.get("CEREBRAS_API_KEY") else "unconfigured",
        "groq": "configured" if os.environ.get("GROQ_API_KEY") else "unconfigured",
        "mistral": "configured" if os.environ.get("MISTRAL_API_KEY") else "unconfigured",
        "cloudflare_ai": "configured" if (os.environ.get("CF_WORKER_URL") or os.environ.get("CLOUDFLARE_API_TOKEN")) else "unconfigured",
        "ollama": "configured" if os.environ.get("OLLAMA_HOST") else "unconfigured",
    }
    logger.info(f"[AI_HEALTH] {health}")
    return health
