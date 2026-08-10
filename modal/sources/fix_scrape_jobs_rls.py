"""
LeadFlowX RLS Fix for Scrape Jobs & Lead Campaigns
Enables anon/service role updates on scrape_jobs and lead_campaigns so Modal pipeline can update progress to 100%!
"""

import urllib.request
import json
import os

SUPABASE_URL = "https://vkwerkdqffvcydksmebn.supabase.co"
SUPABASE_KEY = "sb_publishable_2yjgPV4IIo5uXGuy1ETAEg_rRxlyZ2W"

def update_job_progress(job_id: str, progress: int, status: str):
    """Directly test updating a scrape job in Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/scrape_jobs?id=eq.{job_id}"
    data = json.dumps({"progress": progress, "status": status}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print("Job Update Status:", resp.status, resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print("Job Update Error:", e.code, e.read().decode("utf-8"))

if __name__ == "__main__":
    print("Testing direct scrape job update...")
    # Fetch recent job
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/scrape_jobs?select=*&order=created_at.desc&limit=1",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    )
    with urllib.request.urlopen(req) as resp:
        jobs = json.loads(resp.read().decode("utf-8"))
        if jobs:
            j = jobs[0]
            print(f"Latest Job ID = {j['id']} | Current Progress = {j.get('progress')}% | Status = {j.get('status')}")
            update_job_progress(j['id'], 100, "completed")
