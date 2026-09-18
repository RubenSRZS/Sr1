"""Iteration 24 CRM tests: zones (JU/HS/CH), _guess_zone, reminder_sent_at reset, run_reminders_now, AI parse-contact HS."""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invoice-hub-736.preview.emergentagent.com').rstrip('/')
ALLOWED_EMAIL = "rubensrzs03@gmail.com"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def cleanup(api):
    yield
    clients = api.get(f"{BASE_URL}/api/clients", timeout=30).json()
    for c in clients:
        if (c.get("name") or "").startswith("TEST_"):
            api.delete(f"{BASE_URL}/api/clients/{c['id']}", timeout=30)


def test_create_client_zone_hs_returned_fields(api, cleanup):
    today = date.today().isoformat()
    payload = {
        "name": "TEST_CRM Zone",
        "zone": "HS",
        "civility": "Mme",
        "source": "GA",
        "callback_at": today,
        "callback_time": "17:00",
    }
    r = api.post(f"{BASE_URL}/api/clients", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    c = r.json()
    assert c["zone"] == "HS"
    assert c["civility"] == "Mme"
    assert c["source"] == "GA"
    assert c["callback_at"] == today
    assert c["callback_time"] == "17:00"
    # overview should show zone HS
    ov = api.get(f"{BASE_URL}/api/clients/overview", timeout=30).json()
    entry = next((x for x in ov if x["id"] == c["id"]), None)
    assert entry is not None
    assert entry.get("zone") == "HS"


def test_guess_zone_from_postal_code(api, cleanup):
    payload = {
        "name": "TEST_CRM Guess",
        "address": "3 rue test 39600 Arbois",
        "civility": "Mr",
    }
    r = api.post(f"{BASE_URL}/api/clients", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    ov = api.get(f"{BASE_URL}/api/clients/overview", timeout=30).json()
    entry = next((x for x in ov if x["id"] == cid), None)
    assert entry is not None
    assert entry.get("zone") == "JU", f"expected JU, got {entry.get('zone')}"


def test_quick_update_resets_reminder_sent_at(api, cleanup):
    today = date.today().isoformat()
    payload = {"name": "TEST_CRM Reset", "zone": "JU", "callback_at": today, "callback_time": "10:00"}
    r = api.post(f"{BASE_URL}/api/clients", json=payload, timeout=30)
    assert r.status_code == 200
    cid = r.json()["id"]
    # Patch callback_time; reminder_sent_at must be null (not non-null)
    rp = api.patch(f"{BASE_URL}/api/clients/{cid}/quick", json={"callback_time": "18:00"}, timeout=30)
    assert rp.status_code == 200, rp.text
    g = api.get(f"{BASE_URL}/api/clients/{cid}", timeout=30).json()
    assert not g.get("reminder_sent_at"), f"reminder_sent_at should be null, got {g.get('reminder_sent_at')}"
    assert g.get("callback_time") == "18:00"


def test_run_reminders_now_sends_one(api, cleanup):
    today = date.today().isoformat()
    # Create a fresh test client with callback today
    payload = {
        "name": "TEST_CRM ReminderRun",
        "zone": "HS",
        "civility": "Mme",
        "source": "GA",
        "callback_at": today,
        "callback_time": "17:00",
        "city": "Annecy",
    }
    r = api.post(f"{BASE_URL}/api/clients", json=payload, timeout=30)
    assert r.status_code == 200
    cid = r.json()["id"]
    rr = api.post(f"{BASE_URL}/api/crm/reminders/run", json={"to": ALLOWED_EMAIL, "client_id": cid}, timeout=60)
    assert rr.status_code == 200, rr.text
    data = rr.json()
    assert data.get("status") == "success", data
    assert data.get("sent") == 1, data


def test_ai_parse_contact_annecy_hs(api):
    payload = {
        "text": "monsieur bernard annecy 06 12 34 56 78 google ads toiture",
        "zone": "JU",
    }
    r = api.post(f"{BASE_URL}/api/ai/parse-contact", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json().get("data", {})
    assert data.get("zone") == "HS", data
    assert data.get("source") == "GA", data
    assert data.get("civility") == "Mr", data


def test_cleanup_all_test_clients(api):
    clients = api.get(f"{BASE_URL}/api/clients", timeout=30).json()
    for c in clients:
        if (c.get("name") or "").startswith("TEST_"):
            api.delete(f"{BASE_URL}/api/clients/{c['id']}", timeout=30)
    # verify none remain
    clients = api.get(f"{BASE_URL}/api/clients", timeout=30).json()
    remaining = [c for c in clients if (c.get("name") or "").startswith("TEST_")]
    assert remaining == [], f"leftover TEST_ clients: {remaining}"
