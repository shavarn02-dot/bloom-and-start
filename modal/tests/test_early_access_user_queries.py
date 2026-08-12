"""
Early Access Responses Audit Suite — LeadFlowX
Tests 10 real user search prompts extracted from Google Form responses:
1. Custom Software companies, Real estate, Healthcare
2. Restaurants
3. Aerospace companies
4. AI startups, SaaS, Fintech, real estate
5. Hospital Doctors Healthcare
6. Real estate business in India and UAE, fashion and retail business in India and UAE
7. Saas and enterprise
8. Clients for software development consulting
9. International Boutique consulting companies
10. B2B Businesses
"""

import urllib.request
import json
import time

API_BASE = "https://leadflowx-api.sarthak2005shavarn.workers.dev"

TEST_PROMPTS = [
    {
        "user": "Suyash Ranjan (Mercato)",
        "query": "Custom Software companies, Real estate, Healthcare",
        "locations": ["IN", "US"]
    },
    {
        "user": "Janam Harshavardhan Yadav",
        "query": "Restaurants & Food Services",
        "locations": ["IN"]
    },
    {
        "user": "Aniruddh Kumar (Consecuencia)",
        "query": "Aerospace & Defense companies",
        "locations": ["IN", "US", "GB"]
    },
    {
        "user": "Francisca Prem (The Reliable Jobs)",
        "query": "AI startups, SaaS, Fintech, real estate",
        "locations": ["IN", "US"]
    },
    {
        "user": "Navin (Saanvi MediVet Services)",
        "query": "Hospital Doctors Healthcare",
        "locations": ["IN"]
    },
    {
        "user": "Alice Gautam (Simplify GenAI)",
        "query": "Real estate business in India and UAE, fashion and retail business in India and UAE",
        "locations": ["IN", "AE"]
    },
    {
        "user": "Arpit Singh (Comacks)",
        "query": "Saas and enterprise software companies",
        "locations": ["IN", "US"]
    },
    {
        "user": "Etika Ahuja",
        "query": "Software development consulting clients",
        "locations": ["IN", "US"]
    },
    {
        "user": "Vikash Madhogaria (ConsultantAI)",
        "query": "International Boutique consulting companies",
        "locations": ["IN", "US", "GB"]
    },
    {
        "user": "Bavly Mamdouh Lamey",
        "query": "B2B Technology & Services Businesses",
        "locations": ["IN", "US"]
    }
]

def run_early_access_audit():
    print("=" * 80)
    print("EARLY ACCESS WAITLIST RESPONSES — REAL-TIME SEARCH TEST SUITE")
    print("=" * 80)

    results_summary = []

    for idx, item in enumerate(TEST_PROMPTS, 1):
        print(f"\n[{idx}/10] User: {item['user']}")
        print(f"       Query: '{item['query']}' | Locations: {item['locations']}")

        # 1. Create Campaign
        payload = {
            "name": f"Audit {idx}: {item['user'][:20]}",
            "query": item["query"],
            "locations": item["locations"],
            "search_mode": "smart",
            "requested_limit": 15
        }
        
        req = urllib.request.Request(
            f"{API_BASE}/api/campaigns",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        
        try:
            with urllib.request.urlopen(req) as resp:
                camp_data = json.loads(resp.read().decode("utf-8"))
                camp_id = camp_data[0]["id"] if isinstance(camp_data, list) else camp_data["id"]

            # 2. Run Campaign
            run_req = urllib.request.Request(
                f"{API_BASE}/api/campaigns/{camp_id}/run",
                data=b"{}",
                headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(run_req) as run_resp:
                run_res = json.loads(run_resp.read().decode("utf-8"))

            # 3. Fetch Extracted Leads
            leads_req = urllib.request.Request(
                f"{API_BASE}/api/campaigns/{camp_id}/leads",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(leads_req) as leads_resp:
                leads = json.loads(leads_resp.read().decode("utf-8"))

            print(f"       Status: SUCCESS | Leads Found: {len(leads)}")
            if leads:
                print(f"       Sample Lead #1: {leads[0].get('company_name')} | Contact: {leads[0].get('contact_name')} ({leads[0].get('title')}) | Score: {leads[0].get('confidence')}%")

            results_summary.append({
                "user": item["user"],
                "query": item["query"],
                "leads_found": len(leads),
                "sample": leads[0] if leads else None,
                "status": "PASS" if len(leads) > 0 else "0 LEADS (No canonical match)"
            })

        except Exception as err:
            print(f"       Status: ERROR ({err})")
            results_summary.append({
                "user": item["user"],
                "query": item["query"],
                "leads_found": 0,
                "sample": None,
                "status": f"ERROR: {err}"
            })

    print("\n" + "=" * 80)
    print("FINAL SUMMARY REPORT FOR EARLY ACCESS USER PROMPTS")
    print("=" * 80)
    for r in results_summary:
        print(f"• {r['user']} -> Query: '{r['query']}'")
        print(f"  Result: {r['status']} | Count: {r['leads_found']}")
        if r['sample']:
            print(f"  Top Lead: Company='{r['sample'].get('company_name')}', Role='{r['sample'].get('title')}', Score={r['sample'].get('confidence')}%")

if __name__ == "__main__":
    run_early_access_audit()
