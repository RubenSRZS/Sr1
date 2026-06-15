"""Iteration 18 — Backend tests for new /api/stats/analytics endpoint
and the existing /api/clients/{id}/notes PATCH used by the SmartNotes autosave.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://smart-notes-crm.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- /api/stats/analytics ----------
class TestAnalyticsEndpoint:
    def test_analytics_status_and_shape(self, s):
        r = s.get(f"{BASE_URL}/api/stats/analytics", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        # required keys
        for k in ["conversion_rate", "sent_count", "accepted_count", "avg_days_to_sign",
                  "total_signed", "revenue_by_month", "top_clients"]:
            assert k in d, f"missing key {k}"

    def test_analytics_types_and_ranges(self, s):
        d = s.get(f"{BASE_URL}/api/stats/analytics", timeout=15).json()
        assert isinstance(d["conversion_rate"], (int, float))
        assert 0 <= d["conversion_rate"] <= 100
        assert isinstance(d["sent_count"], int) and d["sent_count"] >= 0
        assert isinstance(d["accepted_count"], int) and d["accepted_count"] >= 0
        assert d["accepted_count"] <= d["sent_count"]
        assert d["avg_days_to_sign"] is None or isinstance(d["avg_days_to_sign"], (int, float))
        assert isinstance(d["total_signed"], (int, float)) and d["total_signed"] >= 0

    def test_revenue_by_month_shape(self, s):
        d = s.get(f"{BASE_URL}/api/stats/analytics", timeout=15).json()
        rbm = d["revenue_by_month"]
        assert isinstance(rbm, list) and len(rbm) == 6
        for entry in rbm:
            assert "label" in entry and "value" in entry
            assert isinstance(entry["label"], str)
            assert isinstance(entry["value"], (int, float))
        # current production data: avr=8450, mai=5440
        by_label = {e["label"]: e["value"] for e in rbm}
        assert by_label.get("avr") == 8450
        assert by_label.get("mai") == 5440

    def test_top_clients_shape(self, s):
        d = s.get(f"{BASE_URL}/api/stats/analytics", timeout=15).json()
        tc = d["top_clients"]
        assert isinstance(tc, list)
        assert len(tc) >= 1
        for c in tc:
            assert "name" in c and "total" in c
            assert isinstance(c["name"], str)
            assert isinstance(c["total"], (int, float))
        # top should be SCOZZAFAVE 2970 (per current data)
        assert tc[0]["name"].strip().upper().startswith("SCOZZAFAVE")
        assert tc[0]["total"] == 2970


# ---------- /api/clients/{id}/notes ----------
class TestNotesPatch:
    @pytest.fixture(scope="class")
    def first_client_id(self, s):
        r = s.get(f"{BASE_URL}/api/clients", timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert len(arr) > 0
        return arr[0]["id"], arr[0].get("notes", "")

    def test_patch_notes_and_restore(self, s, first_client_id):
        cid, original = first_client_id
        # Set a temporary notes value
        tmp = "TEST_iter18_smartnotes_check"
        r = s.patch(f"{BASE_URL}/api/clients/{cid}/notes", json={"notes": tmp}, timeout=15)
        assert r.status_code == 200, r.text
        # GET verifies persistence
        clients = s.get(f"{BASE_URL}/api/clients", timeout=15).json()
        rec = next(x for x in clients if x["id"] == cid)
        assert rec.get("notes") == tmp
        # Restore
        r2 = s.patch(f"{BASE_URL}/api/clients/{cid}/notes", json={"notes": original}, timeout=15)
        assert r2.status_code == 200
        # verify restoration
        clients2 = s.get(f"{BASE_URL}/api/clients", timeout=15).json()
        rec2 = next(x for x in clients2 if x["id"] == cid)
        assert (rec2.get("notes") or "") == (original or "")

    def test_patch_notes_404_on_unknown_client(self, s):
        r = s.patch(f"{BASE_URL}/api/clients/nonexistent-id-zzz/notes", json={"notes": "x"}, timeout=15)
        assert r.status_code == 404
