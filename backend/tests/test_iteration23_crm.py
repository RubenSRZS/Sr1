"""Iteration 23 CRM tests: country, civility, source, callback_time, AI parse-contact."""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://invoice-hub-736.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- AI parse-contact ---
def test_ai_parse_contact_ch_mme(api):
    payload = {
        "text": "madame martin lausanne 079 123 45 67 vu sur facebook facade 80m2 rappeler lundi 17h",
        "country": "CH",
    }
    r = api.post(f"{BASE_URL}/api/ai/parse-contact", json=payload, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json().get("data", {})
    assert data.get("civility") == "Mme", data
    assert data.get("source") == "FB", data
    phone = (data.get("phone") or "").replace(" ", "")
    assert phone.startswith("+41"), f"phone={data.get('phone')}"
    assert data.get("callback_time") == "17:00", data
    cb = data.get("callback_at")
    assert cb, "callback_at should be a date"
    # ISO YYYY-MM-DD parseable
    from datetime import datetime
    datetime.strptime(cb, "%Y-%m-%d")


# --- Client CRUD with new fields ---
def test_client_full_lifecycle_ch(api):
    today = date.today().isoformat()
    payload = {
        "name": "TEST_CRM Suisse",
        "civility": "Mr",
        "country": "CH",
        "source": "GA",
        "callback_at": today,
        "callback_time": "17:00",
        "city": "Genève",
    }
    r = api.post(f"{BASE_URL}/api/clients", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    c = r.json()
    cid = c["id"]
    try:
        assert c["civility"] == "Mr"
        assert c["country"] == "CH"
        assert c["source"] == "GA"
        assert c["callback_time"] == "17:00"
        assert c["callback_at"] == today
        assert c["city"] == "Genève"

        # overview
        ov = api.get(f"{BASE_URL}/api/clients/overview", timeout=30).json()
        entry = next((x for x in ov if x["id"] == cid), None)
        assert entry is not None
        for k in ("civility", "country", "source", "callback_time", "callback_at", "city"):
            assert entry.get(k) == payload[k], f"overview missing/mismatch {k}: {entry.get(k)}"

        # quick patch
        rp = api.patch(f"{BASE_URL}/api/clients/{cid}/quick", json={"source": "FB", "civility": "Mme"}, timeout=30)
        assert rp.status_code == 200, rp.text
        rp_data = rp.json()
        assert rp_data["source"] == "FB"
        assert rp_data["civility"] == "Mme"
        # persisted
        g = api.get(f"{BASE_URL}/api/clients/{cid}", timeout=30).json()
        assert g["source"] == "FB"
        assert g["civility"] == "Mme"
    finally:
        api.delete(f"{BASE_URL}/api/clients/{cid}", timeout=30)


def test_cleanup_test_clients(api):
    # Best-effort ensure no TEST_ leftovers
    clients = api.get(f"{BASE_URL}/api/clients", timeout=30).json()
    for c in clients:
        if (c.get("name") or "").startswith("TEST_"):
            api.delete(f"{BASE_URL}/api/clients/{c['id']}", timeout=30)
