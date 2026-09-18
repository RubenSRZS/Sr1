"""Iteration 22 - CRM revamp: overview, quick update, AI parse/tidy."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://invoice-hub-736.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_client(http):
    payload = {
        "name": "TEST_CRM Agent",
        "phone": "06 11 22 33 44",
        "email": "",
        "address": "1 rue de test, Belfort",
        "city": "Belfort",
        "chantier": "Nettoyage toiture 100 m²",
        "callback_at": "2026-09-18",
        "source": "test",
        "notes": "• initial",
    }
    r = http.post(f"{API}/clients", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "TEST_CRM Agent"
    assert data["city"] == "Belfort"
    assert data["chantier"] == "Nettoyage toiture 100 m²"
    assert data["callback_at"] == "2026-09-18"
    assert data["source"] == "test"
    assert "id" in data
    yield data
    # cleanup
    http.delete(f"{API}/clients/{data['id']}")


def test_overview_returns_enriched_list(http, created_client):
    r = http.get(f"{API}/clients/overview")
    assert r.status_code == 200
    lst = r.json()
    assert isinstance(lst, list)
    mine = next((c for c in lst if c["id"] == created_client["id"]), None)
    assert mine, "Created client missing from overview"
    for k in ("stage", "last_activity", "quotes_count", "invoices_count",
              "total_signed", "total_invoiced", "pending_amount"):
        assert k in mine, f"Missing key: {k}"
    assert mine["stage"] in ("contact", "quote_draft", "quote_sent", "signed", "invoiced", "lost")
    assert mine["stage"] == "contact"
    assert mine["quotes_count"] == 0
    assert mine["invoices_count"] == 0


def test_quick_update_partial(http, created_client):
    cid = created_client["id"]
    r = http.patch(f"{API}/clients/{cid}/quick", json={"notes": "• test", "callback_at": "2026-09-18"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["notes"] == "• test"
    assert data["callback_at"] == "2026-09-18"
    # unchanged fields still there
    assert data["city"] == "Belfort"
    assert data["chantier"] == "Nettoyage toiture 100 m²"
    # verify persisted
    r2 = http.get(f"{API}/clients/{cid}")
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["notes"] == "• test"
    assert d2["callback_at"] == "2026-09-18"


def test_ai_parse_contact(http):
    text = "dupont 0612345678 belfort toiture 120m2 mousse coté nord rappeler mardi"
    r = http.post(f"{API}/ai/parse-contact", json={"text": text}, timeout=60)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") == "success"
    d = body.get("data") or {}
    assert "dupont" in (d.get("name") or "").lower()
    phone = d.get("phone") or ""
    # phone formatted with spaces
    assert re.match(r"^0\d(\s\d{2}){4}$", phone), f"Unexpected phone: {phone}"
    assert "belfort" in (d.get("city") or "").lower()
    cb = d.get("callback_at") or ""
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", cb), f"Bad callback: {cb}"


def test_ai_tidy_notes(http):
    r = http.post(f"{API}/ai/tidy-notes",
                  json={"text": "mousse nord\nprix 1200\ndispo matin", "client_name": "Test"},
                  timeout=60)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") == "success"
    notes = body.get("notes") or ""
    lines = [l for l in notes.split("\n") if l.strip()]
    bullet_lines = [l for l in lines if l.strip().startswith("•")]
    assert bullet_lines, f"No bullet lines in: {notes}"
    # Most content lines should start with '• '
    assert len(bullet_lines) >= 2, f"Expected multiple bullets, got: {notes}"


def test_delete_client_and_verify_gone(http):
    # create a throwaway
    r = http.post(f"{API}/clients", json={"name": "TEST_CRM Delete Me", "city": "Dole"})
    assert r.status_code == 200
    cid = r.json()["id"]
    d = http.delete(f"{API}/clients/{cid}")
    assert d.status_code == 200
    g = http.get(f"{API}/clients/{cid}")
    assert g.status_code == 404
