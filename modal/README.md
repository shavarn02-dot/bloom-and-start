# LeadFlowX Modal Engine

This directory contains the Python-based scraping/AI/scoring engine deployed to [Modal.com](https://modal.com).

## Architecture

```
pipeline.py          → Main orchestrator (Modal entry point)
├── ai_router.py     → 5-provider AI fallback (Cerebras → Groq → Mistral → CF AI → Ollama)
├── email_engine.py  → Email pattern gen + MX verification + quality scoring
├── scraper_tiered.py → 3-tier scraper (httpx → Crawl4AI → Playwright)
└── lead_scorer.py   → Rule-based lead scoring + ICP matching + dedup
```

## Deploy

```bash
# 1. Install Modal CLI
pip install modal

# 2. Authenticate
modal token new

# 3. Set secrets (one-time)
modal secret create leadflowx-secrets \
  CEREBRAS_API_KEY=xxx \
  GROQ_API_KEY=xxx \
  MISTRAL_API_KEY=xxx \
  SUPABASE_URL=xxx \
  SUPABASE_SERVICE_KEY=xxx \
  CF_WORKER_URL=https://leadgen-api.sarthak2005shavarn.workers.dev

# 4. Deploy
cd modal
modal deploy pipeline.py
```

## Test locally

```bash
# Run pipeline locally (not on Modal infra)
modal run pipeline.py

# Test health endpoint
curl <your-modal-url>/health
```

## RAM/Cost Budget

| Component | RAM | Cost/Campaign |
|:--|:--|:--|
| Pipeline (Tier 1 only) | ~80MB | ~$0.0005 |
| Pipeline (with Crawl4AI) | ~380MB | ~$0.002 |
| $25 credit | - | ~25,000 campaigns |
