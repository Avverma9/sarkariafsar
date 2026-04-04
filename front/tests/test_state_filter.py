#!/usr/bin/env python3
"""
UI/API Test for State Filter functionality
Tests /api/post/states and /api/post/filter endpoints
"""

import requests
import sys

API_BASE = "http://localhost:5000/api"
SECTIONS = ["Results", "Latest Gov Jobs", "Recent Admit Cards", "Admission"]

GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
RESET = "\033[0m"

passed = 0
failed = 0

def ok(msg):
    global passed
    passed += 1
    print(f"  {GREEN}✓{RESET} {msg}")

def fail(msg):
    global failed
    failed += 1
    print(f"  {RED}✗{RESET} {msg}")

def header(msg):
    print(f"\n{CYAN}── {msg} ──{RESET}")

# ── 1. GET /api/post/states ───────────────────────────────────────────────
header("GET /api/post/states")
try:
    r = requests.get(f"{API_BASE}/post/states", timeout=10)
    if r.status_code == 200:
        ok(f"Status 200")
    else:
        fail(f"Expected 200, got {r.status_code}")

    data = r.json()
    if data.get("success"):
        ok("success=true")
    else:
        fail(f"success not true: {data}")

    states = data.get("data", [])
    if isinstance(states, list) and len(states) > 0:
        ok(f"States returned: {len(states)} — e.g. {states[:3]}")
    else:
        fail(f"No states returned: {states}")

    # store for later use
    first_state = states[0] if states else None
except Exception as e:
    fail(f"Request failed: {e}")
    first_state = None

# ── 2. GET /api/post/filter — no params (all jobs) ───────────────────────
header("GET /api/post/filter (no filters)")
try:
    r = requests.get(f"{API_BASE}/post/filter", timeout=10)
    if r.status_code == 200:
        ok("Status 200")
    else:
        fail(f"Expected 200, got {r.status_code}")
    d = r.json()
    if d.get("success"):
        ok(f"success=true, total={d.get('total')}, jobs={len(d.get('data',[]))}")
    else:
        fail(f"success not true: {d}")
except Exception as e:
    fail(f"Request failed: {e}")

# ── 3. GET /api/post/filter — each section, no state ─────────────────────
header("GET /api/post/filter by sectionName (no state)")
for section in SECTIONS:
    try:
        r = requests.get(f"{API_BASE}/post/filter", params={"sectionName": section, "limit": 10}, timeout=10)
        d = r.json()
        count = len(d.get("data", []))
        if r.status_code == 200 and d.get("success"):
            ok(f"sectionName={section!r} → {count} jobs")
        else:
            fail(f"sectionName={section!r} → {r.status_code} {d}")
    except Exception as e:
        fail(f"sectionName={section!r} → {e}")

# ── 4. GET /api/post/filter — with state ─────────────────────────────────
if first_state:
    header(f"GET /api/post/filter with state='{first_state}'")
    try:
        r = requests.get(f"{API_BASE}/post/filter", params={"state": first_state, "limit": 10}, timeout=10)
        d = r.json()
        count = len(d.get("data", []))
        if r.status_code == 200 and d.get("success"):
            ok(f"state={first_state!r} → {count} jobs, total={d.get('total')}")
            # verify all returned jobs have the correct state
            jobs = d.get("data", [])
            wrong = [j.get("state") for j in jobs if j.get("state") != first_state]
            if not wrong:
                ok("All returned jobs have correct state")
            else:
                fail(f"Some jobs have wrong state: {wrong[:3]}")
        else:
            fail(f"state={first_state!r} → {r.status_code} {d}")
    except Exception as e:
        fail(f"state={first_state!r} → {e}")

    # state + sectionName
    header(f"GET /api/post/filter with state + sectionName")
    for section in SECTIONS[:2]:
        try:
            r = requests.get(f"{API_BASE}/post/filter",
                             params={"state": first_state, "sectionName": section, "limit": 10},
                             timeout=10)
            d = r.json()
            count = len(d.get("data", []))
            if r.status_code == 200 and d.get("success"):
                ok(f"state={first_state!r} + sectionName={section!r} → {count} jobs")
            else:
                fail(f"→ {r.status_code} {d}")
        except Exception as e:
            fail(f"→ {e}")

# ── 5. "All States" reset — state param empty / absent ───────────────────
header("GET /api/post/filter reset (All States = no state param)")
try:
    r = requests.get(f"{API_BASE}/post/filter",
                     params={"sectionName": "Results", "limit": 10},
                     timeout=10)
    d = r.json()
    count = len(d.get("data", []))
    if r.status_code == 200 and d.get("success") and count > 0:
        ok(f"No state filter returns {count} jobs — 'All States' reset will work")
    else:
        fail(f"No jobs returned without state filter: {d}")
except Exception as e:
    fail(f"Reset check failed: {e}")

# ── Summary ───────────────────────────────────────────────────────────────
print(f"\n{'='*40}")
print(f"Results: {GREEN}{passed} passed{RESET}  {RED}{failed} failed{RESET}")
if failed:
    sys.exit(1)
