"""
Tiered Web Scraper — 3-tier approach for RAM-efficient lead extraction.

Tier 1: httpx + BeautifulSoup  (~10MB RAM) — static HTML pages (90% of sites)
Tier 2: Crawl4AI                (~300MB RAM) — JS-rendered pages (9%)
Tier 3: Playwright              (~500MB RAM) — complex SPAs (1%)

Each tier auto-promotes to the next when content extraction fails.

Lead data extracted:
  - Company name, industry, location, size
  - Contact names, titles, emails, phones
  - Source URL and page type
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import time
from dataclasses import dataclass, field, asdict
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from email_engine import extract_emails_from_text

logger = logging.getLogger("scraper")

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class ExtractedContact:
    """A single contact person explicitly found on a public page."""
    name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    source_url: str = ""

@dataclass
class ExtractedCompany:
    """Company-level data extracted from a website."""
    company_name: str = ""
    industry: str = ""
    location: str = ""
    company_size: str = ""
    website: str = ""
    description: str = ""
    contacts: list[ExtractedContact] = field(default_factory=list)
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    source_url: str = ""
    page_type: str = "unknown"
    content_hash: str = ""
    scrape_tier: str = "httpx"

@dataclass
class SearchResult:
    """A single search result with URL, title, snippet."""
    url: str = ""
    title: str = ""
    snippet: str = ""


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

# Pages likely to contain contact/team info
CONTACT_PATHS = [
    "/contact", "/contact-us", "/contactus", "/get-in-touch",
    "/about", "/about-us", "/aboutus", "/our-story",
    "/team", "/our-team", "/ourteam", "/people", "/leadership",
    "/staff", "/management", "/who-we-are",
]

PHONE_REGEX = re.compile(
    r"""(?:(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?"""
    r"""\d{3,4}[\s.-]?\d{3,4})""",
    re.VERBOSE,
)

# ---------------------------------------------------------------------------
# Tier 1: httpx + BeautifulSoup (lightweight, ~10MB RAM)
# ---------------------------------------------------------------------------

async def _fetch_page(url: str, timeout: int = 15) -> tuple[int, str, str]:
    """
    Fetch a page via HTTP. Returns (status_code, html_content, final_url).
    If the page requires JS rendering, the content may be empty/incomplete.
    """
    import random
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
    }

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        max_redirects=5,
    ) as client:
        resp = await client.get(url, headers=headers)
        return resp.status_code, resp.text, str(resp.url)


def _extract_text_from_html(html: str) -> str:
    """Strip HTML tags and return clean text."""
    soup = BeautifulSoup(html, "html.parser")
    # Remove script and style elements
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def _extract_company_from_html(html: str, url: str) -> ExtractedCompany:
    """Extract company info and contacts from raw HTML."""
    soup = BeautifulSoup(html, "html.parser")
    company = ExtractedCompany(source_url=url, scrape_tier="httpx")

    # Extract page title as company name fallback
    title_tag = soup.find("title")
    if title_tag:
        title_text = title_tag.get_text(strip=True)
        # Remove common suffixes
        for suffix in [" - Home", " | Home", " – Home", " - Official", " | Official"]:
            title_text = title_text.replace(suffix, "")
        company.company_name = title_text[:100]

    # Extract meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        company.description = meta_desc["content"][:500]

    # Extract all text for email/phone extraction
    full_text = _extract_text_from_html(html)

    # Extract emails from text
    company.emails = extract_emails_from_text(full_text)

    # Extract phone numbers
    phones = PHONE_REGEX.findall(full_text)
    # Filter: keep only strings that look like real phone numbers (7+ digits)
    company.phones = [
        p.strip() for p in phones
        if sum(c.isdigit() for c in p) >= 7
    ][:10]  # max 10 phones

    # Try to extract structured contact data (common patterns)
    company.contacts = _extract_contacts_from_soup(soup, url)

    # Determine page type from URL
    path = urlparse(url).path.lower()
    if any(p in path for p in ["/contact", "/get-in-touch"]):
        company.page_type = "contact"
    elif any(p in path for p in ["/about", "/our-story", "/who-we-are"]):
        company.page_type = "about"
    elif any(p in path for p in ["/team", "/people", "/leadership", "/staff"]):
        company.page_type = "team"
    else:
        company.page_type = "homepage"

    # Extract domain as website
    parsed = urlparse(url)
    company.website = f"{parsed.scheme}://{parsed.netloc}"

    return company


def _extract_contacts_from_soup(soup: BeautifulSoup, source_url: str = "") -> list[ExtractedContact]:
    """Extract only contacts explicitly represented in structured page content."""
    contacts = []

    # Strategy 1: Look for team member cards (common patterns)
    # Look for elements with common team-related classes
    team_selectors = [
        {"class_": re.compile(r"team|member|person|staff|people|employee|leader", re.I)},
    ]

    for selector in team_selectors:
        elements = soup.find_all(["div", "article", "li", "section"], **selector)
        for el in elements[:20]:  # Max 20 team members
            contact = ExtractedContact()
            # Look for name in headings
            name_tag = el.find(["h2", "h3", "h4", "h5", "strong"])
            if name_tag:
                name = name_tag.get_text(strip=True)
                if 2 <= len(name.split()) <= 5 and len(name) < 60:
                    contact.name = name

            # Look for title/role
            title_tag = el.find(["p", "span", "small"], class_=re.compile(r"title|role|position|designation", re.I))
            if title_tag:
                contact.title = title_tag.get_text(strip=True)[:100]

            # Look for email link
            email_link = el.find("a", href=re.compile(r"^mailto:"))
            if email_link:
                contact.email = email_link["href"].replace("mailto:", "").split("?")[0].strip()

            if contact.name:
                contact.source_url = source_url
                contacts.append(contact)

    return contacts


async def scrape_page_tier1(url: str) -> Optional[ExtractedCompany]:
    """
    Tier 1: httpx + BeautifulSoup scraper.
    Fast, lightweight (~10MB RAM), works for static HTML pages.
    """
    try:
        status, html, final_url = await _fetch_page(url)
        if status != 200 or len(html) < 100:
            return None

        # Check if page requires JS (common signals)
        if _needs_javascript(html):
            logger.info(f"Page needs JS: {url} — promoting to Tier 2")
            return None  # Caller will try Tier 2

        return _extract_company_from_html(html, final_url)

    except (httpx.TimeoutException, httpx.ConnectError) as e:
        logger.warning(f"Tier 1 failed for {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Tier 1 error for {url}: {e}")
        return None


def _needs_javascript(html: str) -> bool:
    """Heuristic: does the page likely need JS rendering?"""
    # Common signals of JS-only pages
    signals = [
        "window.__NEXT_DATA__" in html and "<main" not in html.lower(),
        '<div id="root"></div>' in html and len(html) < 5000,
        '<div id="app"></div>' in html and len(html) < 5000,
        "noscript" in html.lower() and "enable javascript" in html.lower(),
    ]
    return any(signals)


# ---------------------------------------------------------------------------
# Tier 2: Crawl4AI fallback (skeleton — needs crawl4ai installed)
# ---------------------------------------------------------------------------

async def scrape_page_tier2(url: str) -> Optional[ExtractedCompany]:
    """
    Tier 2: Crawl4AI scraper.
    Handles JS-rendered pages, outputs LLM-ready markdown.
    ~300MB RAM (needs Chromium).
    """
    try:
        from crawl4ai import AsyncWebCrawler

        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=url)
            if not result.success or not result.markdown:
                return None

            # Extract from markdown text
            company = ExtractedCompany(
                source_url=url,
                scrape_tier="crawl4ai",
            )
            company.emails = extract_emails_from_text(result.markdown)
            company.phones = PHONE_REGEX.findall(result.markdown)
            company.phones = [p for p in company.phones if sum(c.isdigit() for c in p) >= 7][:10]

            # Use page title
            if result.metadata and result.metadata.get("title"):
                company.company_name = result.metadata["title"][:100]

            # Use page description
            if result.metadata and result.metadata.get("description"):
                company.description = result.metadata["description"][:500]

            parsed = urlparse(url)
            company.website = f"{parsed.scheme}://{parsed.netloc}"

            return company

    except ImportError:
        logger.info(f"crawl4ai not installed — delegating JS scraping to Playwright Tier 3 for {url}")
        return await scrape_page_tier3(url)
    except Exception as e:
        logger.error(f"Tier 2 error for {url}: {e}")
        return await scrape_page_tier3(url)


# ---------------------------------------------------------------------------
# Tier 3: Playwright fallback (skeleton — needs playwright installed)
# ---------------------------------------------------------------------------

async def scrape_page_tier3(url: str) -> Optional[ExtractedCompany]:
    """
    Tier 3: Playwright scraper.
    Handles complex SPAs, login-gated content, heavy anti-bot sites.
    ~500MB RAM (full Chromium instance).
    """
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(2000)  # Wait for JS rendering

            html = await page.content()
            await browser.close()

            if len(html) < 100:
                return None

            company = _extract_company_from_html(html, url)
            company.scrape_tier = "playwright"
            return company

    except ImportError:
        logger.warning("playwright not installed — skipping Tier 3")
        return None
    except Exception as e:
        logger.error(f"Tier 3 error for {url}: {e}")
        return None


# ---------------------------------------------------------------------------
# Auto-tier scraper (tries Tier 1 → 2 → 3)
# ---------------------------------------------------------------------------

async def scrape_page(url: str) -> Optional[ExtractedCompany]:
    """
    Scrape a page using the 3-tier approach.
    Starts with Tier 1 (cheapest), promotes as needed.
    """
    # Tier 1: httpx + BS4
    result = await scrape_page_tier1(url)
    if result and (result.emails or result.contacts or result.description):
        return result

    # Tier 2: Crawl4AI
    logger.info(f"Promoting to Tier 2 for {url}")
    result = await scrape_page_tier2(url)
    if result and (result.emails or result.contacts):
        return result

    # Tier 3: Playwright
    logger.info(f"Promoting to Tier 3 for {url}")
    return await scrape_page_tier3(url)


# ---------------------------------------------------------------------------
# Discover internal pages (about, contact, team)
# ---------------------------------------------------------------------------

async def discover_contact_pages(base_url: str) -> list[str]:
    """
    Given a company's homepage URL, find likely contact/about/team pages.
    Uses httpx to check which CONTACT_PATHS exist.
    """
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    found_urls = []

    # Also check the homepage itself
    found_urls.append(base_url)

    # Try common paths concurrently
    sem = asyncio.Semaphore(5)

    async def _check_path(path: str) -> Optional[str]:
        async with sem:
            url = urljoin(base + "/", path.lstrip("/"))
            try:
                async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
                    resp = await client.head(url, headers={"User-Agent": USER_AGENTS[0]})
                    if resp.status_code == 200:
                        return str(resp.url)
            except Exception:
                pass
            return None

    results = await asyncio.gather(*[_check_path(p) for p in CONTACT_PATHS])
    for r in results:
        if r and r not in found_urls:
            found_urls.append(r)

    return found_urls


# ---------------------------------------------------------------------------
# Search query generation (DuckDuckGo HTML scraping — no API key)
# ---------------------------------------------------------------------------

async def search_duckduckgo(query: str, max_results: int = 20) -> list[SearchResult]:
    """
    Scrape DuckDuckGo search results (no API key needed).
    Supports HTML & Lite endpoints with GET/POST fallbacks.
    """
    import random
    from urllib.parse import quote_plus, parse_qs, unquote, urlparse

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://duckduckgo.com/",
    }

    endpoints = [
        ("GET", f"https://html.duckduckgo.com/html/?q={quote_plus(query)}", None),
        ("POST", "https://html.duckduckgo.com/html/", {"q": query}),
        ("POST", "https://lite.duckduckgo.com/lite/", {"q": query}),
    ]

    results = []

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        for method, url, data in endpoints:
            try:
                if method == "GET":
                    resp = await client.get(url, headers=headers)
                else:
                    resp = await client.post(url, data=data, headers=headers)

                if resp.status_code != 200:
                    logger.warning(f"DuckDuckGo {method} {url} returned {resp.status_code}")
                    await asyncio.sleep(1)
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")

                links = soup.find_all("a", class_="result__a")
                if not links:
                    links = soup.find_all("a", class_=re.compile(r"result-link|result__url|result__title", re.I))

                for link in links:
                    href = link.get("href", "")
                    title = link.get_text(strip=True)

                    if "uddg=" in href:
                        params = parse_qs(urlparse(href).query)
                        if "uddg" in params:
                            href = unquote(params["uddg"][0])

                    if href and href.startswith("http") and not any(skip in href.lower() for skip in ["duckduckgo.com", "duck.co"]):
                        snippet_el = link.find_parent(["div", "tr", "td"])
                        snippet = ""
                        if snippet_el:
                            snippet_text = snippet_el.find(class_=re.compile(r"snippet|abstract", re.I))
                            if snippet_text:
                                snippet = snippet_text.get_text(strip=True)

                        results.append(SearchResult(url=href, title=title, snippet=snippet))

                    if len(results) >= max_results:
                        break

                if results:
                    break

            except Exception as e:
                logger.error(f"Search error on {url}: {e}")
                continue

        # If DuckDuckGo rate limited (202), try Brave Search fallback
        if not results:
            try:
                brave_url = f"https://search.brave.com/search?q={quote_plus(query)}"
                resp = await client.get(brave_url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    for card in soup.find_all(["div", "li"], class_=re.compile(r"fresnel-container|snippet", re.I)):
                        link = card.find("a", href=re.compile(r"^https?://"))
                        if link:
                            href = link["href"]
                            title = link.get_text(strip=True)
                            if not any(skip in href.lower() for skip in ["brave.com", "duckduckgo.com", "google.com"]):
                                results.append(SearchResult(url=href, title=title, snippet=""))
                        if len(results) >= max_results:
                            break
            except Exception as e:
                logger.error(f"Brave search fallback error: {e}")

    return results


# ---------------------------------------------------------------------------
# Full scrape pipeline for a single company URL
# ---------------------------------------------------------------------------

async def scrape_company(url: str) -> ExtractedCompany:
    """
    Full scrape pipeline for a single company:
    1. Discover internal pages (about, contact, team)
    2. Scrape each page using tiered approach
    3. Merge all extracted data into one ExtractedCompany
    """
    # Step 1: Find relevant pages
    pages = await discover_contact_pages(url)
    logger.info(f"Found {len(pages)} pages to scrape for {url}")

    # Step 2: Scrape all pages (concurrently, max 3)
    sem = asyncio.Semaphore(3)

    async def _scrape(page_url: str) -> Optional[ExtractedCompany]:
        async with sem:
            await asyncio.sleep(1)  # Polite delay
            return await scrape_page(page_url)

    page_results = await asyncio.gather(*[_scrape(p) for p in pages[:8]])  # Max 8 pages

    # Step 3: Merge results
    merged = ExtractedCompany(source_url=url)
    all_emails = set()
    all_phones = set()
    all_contacts = []

    for pr in page_results:
        if pr is None:
            continue
        if not merged.company_name and pr.company_name:
            merged.company_name = pr.company_name
        if not merged.description and pr.description:
            merged.description = pr.description
        if not merged.industry and pr.industry:
            merged.industry = pr.industry
        if not merged.location and pr.location:
            merged.location = pr.location
        if not merged.website and pr.website:
            merged.website = pr.website

        all_emails.update(pr.emails)
        all_phones.update(pr.phones)
        all_contacts.extend(pr.contacts)

        # Use the most specific scrape tier
        if pr.scrape_tier == "playwright":
            merged.scrape_tier = "playwright"
        elif pr.scrape_tier == "crawl4ai" and merged.scrape_tier != "playwright":
            merged.scrape_tier = "crawl4ai"

    merged.emails = list(all_emails)[:20]
    merged.phones = list(all_phones)[:10]

    # Deduplicate contacts by name
    seen_names = set()
    for c in all_contacts:
        dedup_key = (c.name.strip().lower(), c.email.strip().lower())
        if c.name and dedup_key not in seen_names:
            seen_names.add(dedup_key)
            merged.contacts.append(c)

    return merged
