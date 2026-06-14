"""Backend tests for iteration 16:
- /api/clients/{id}/timeline
- /api/clients/{id}/notes (PATCH)
- /api/quotes/{id}/public-token (POST)
- open_count / last_opened_at tracking via /api/public/quote/{token}/opened
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def first_client(session):
    r = session.get(f"{API}/clients")
    assert r.status_code == 200, r.text
    clients = r.json()
    assert isinstance(clients, list) and len(clients) > 0
    return clients[0]


@pytest.fixture(scope="module")
def any_quote(session):
    r = session.get(f"{API}/quotes")
    assert r.status_code == 200
    quotes = r.json()
    assert len(quotes) > 0
    return quotes[0]


class TestClientTimeline:
    def test_timeline_ok(self, session, first_client):
        cid = first_client["id"]
        r = session.get(f"{API}/clients/{cid}/timeline")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "client" in data
        assert "events" in data
        assert "stats" in data
        stats = data["stats"]
        for k in ("quotes_count", "invoices_count", "total_signed", "total_invoiced"):
            assert k in stats, f"missing key {k}"
        assert isinstance(data["events"], list)
        # If events present, validate shape
        for e in data["events"]:
            assert e["type"] in ("quote", "invoice")
            assert "id" in e and "number" in e and "status" in e
            assert "_id" not in e
        # client must not leak _id
        assert "_id" not in data["client"]

    def test_timeline_404(self, session):
        r = session.get(f"{API}/clients/nonexistent-id-xyz/timeline")
        assert r.status_code == 404


class TestClientNotes:
    def test_update_notes_and_persist(self, session, first_client):
        cid = first_client["id"]
        original_notes = first_client.get("notes", "")
        test_text = "TEST_NOTES_iter16 10x100\n50+25"
        r = session.patch(f"{API}/clients/{cid}/notes", json={"notes": test_text})
        assert r.status_code == 200, r.text
        # verify persistence via GET
        r2 = session.get(f"{API}/clients/{cid}")
        assert r2.status_code == 200
        assert r2.json().get("notes") == test_text
        # restore
        session.patch(f"{API}/clients/{cid}/notes", json={"notes": original_notes or ""})

    def test_update_notes_404(self, session):
        r = session.patch(f"{API}/clients/nonexistent-xyz/notes", json={"notes": "x"})
        assert r.status_code == 404


class TestPublicToken:
    def test_create_or_get_public_token(self, session, any_quote):
        qid = any_quote["id"]
        r = session.post(f"{API}/quotes/{qid}/public-token")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "public_token" in data
        assert isinstance(data["public_token"], str)
        assert len(data["public_token"]) > 10
        # Calling again should return same token (idempotent)
        r2 = session.post(f"{API}/quotes/{qid}/public-token")
        assert r2.status_code == 200
        assert r2.json()["public_token"] == data["public_token"]

    def test_public_token_404(self, session):
        r = session.post(f"{API}/quotes/nonexistent-xyz/public-token")
        assert r.status_code == 404


class TestOpenTracking:
    def test_open_count_increments(self, session, any_quote):
        qid = any_quote["id"]
        # Ensure public_token exists
        tok = session.post(f"{API}/quotes/{qid}/public-token").json()["public_token"]
        # Get current count
        before = session.get(f"{API}/quotes").json()
        before_q = next((q for q in before if q["id"] == qid), None)
        assert before_q is not None
        before_count = before_q.get("open_count", 0) or 0
        # Track open twice
        r = session.post(f"{API}/public/quote/{tok}/opened")
        assert r.status_code == 200
        r = session.post(f"{API}/public/quote/{tok}/opened")
        assert r.status_code == 200
        # Verify count incremented
        after = session.get(f"{API}/quotes").json()
        after_q = next((q for q in after if q["id"] == qid), None)
        assert after_q is not None
        after_count = after_q.get("open_count", 0) or 0
        assert after_count >= before_count + 2, f"open_count {before_count} -> {after_count}"
        assert after_q.get("last_opened_at") is not None


class TestExtraAttachmentsSchema:
    """Ensure SendQuoteEmail/SendInvoiceEmail accept extra_attachments field
    (without sending a real email — backend must validate payload structure)."""
    def test_quote_send_email_schema_ok_invalid_id(self, session):
        # Use bogus id to avoid real email; we should get 404, not 422
        payload = {
            "subject": "TEST",
            "message": "TEST",
            "recipient_email": "rubensrzs03@gmail.com",
            "extra_attachments": [{"filename": "a.txt", "content": "aGVsbG8="}],
        }
        r = session.post(f"{API}/quotes/nonexistent-xyz/send-email", json=payload)
        assert r.status_code == 404, f"expected 404, got {r.status_code}: {r.text}"

    def test_invoice_send_email_schema_ok_invalid_id(self, session):
        payload = {
            "subject": "TEST",
            "message": "TEST",
            "recipient_email": "rubensrzs03@gmail.com",
            "extra_attachments": [{"filename": "a.txt", "content": "aGVsbG8="}],
        }
        r = session.post(f"{API}/invoices/nonexistent-xyz/send-email", json=payload)
        assert r.status_code == 404
