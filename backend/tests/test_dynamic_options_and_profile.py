"""
Backend tests for two new features (iteration 13):
  1) Quote profile (company snapshot) selection via profile_id on POST/PUT /api/quotes
  2) Dynamic additional_options (illimitées) with proper compute_option_block totals
     incl. line-level remise en € (amount) on Service and global option-level remise en €.

All test data uses work_location starting with "TEST QA - a supprimer" so it can be
cleaned up afterwards. NO email is sent (no /api/quotes/{id}/send call).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"

PROFILE_SR = "e5a4b05f-4811-4e9c-a5e1-408545a10d80"   # SR Rénovation
PROFILE_UGREEN = "4ecc93d3-f98f-462e-9a8f-88f1cd449b9b"  # Câble Ethernet Ugreen (default)
TEST_LOCATION_PREFIX = "TEST QA - a supprimer"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def client_id(api):
    r = api.get(f"{BASE_URL}/api/clients")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) > 0
    return data[0]["id"]


_created_quote_ids = []


@pytest.fixture(scope="module", autouse=True)
def cleanup(api):
    yield
    for qid in list(_created_quote_ids):
        try:
            api.delete(f"{BASE_URL}/api/quotes/{qid}")
        except Exception:
            pass


def _service(desc, qty, price, remise_type="percent", remise_percent=0.0, remise_montant=0.0):
    if remise_type == "amount":
        total = max(qty * price - remise_montant, 0)
    else:
        total = max(qty * price * (1 - remise_percent / 100), 0)
    return {
        "description": desc, "quantity": qty, "unit": "unité",
        "unit_price": price, "remise_type": remise_type,
        "remise_percent": remise_percent, "remise_montant": remise_montant,
        "total": round(total, 2),
    }


# ─── Profiles endpoint ─────────────────────────────────────────────
class TestProfiles:
    def test_profiles_list_contains_known_ids(self, api):
        r = api.get(f"{BASE_URL}/api/profiles")
        assert r.status_code == 200
        ids = {p["id"]: p for p in r.json()}
        assert PROFILE_SR in ids and ids[PROFILE_SR]["company_name"] == "SR Rénovation"
        assert PROFILE_UGREEN in ids and ids[PROFILE_UGREEN]["company_name"] == "Câble Ethernet Ugreen"


# ─── Profile snapshot on quote create ─────────────────────────────
class TestQuoteCompanySnapshot:
    def test_create_quote_with_sr_profile_snapshots_company(self, api, client_id):
        payload = {
            "client_id": client_id,
            "profile_id": PROFILE_SR,
            "work_location": f"{TEST_LOCATION_PREFIX} - profile sr",
            "services": [_service("Test prestation", 1, 100.0)],
            "remise_percent": 0, "remise_montant": 0,
            "additional_options": [],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        q = r.json()
        _created_quote_ids.append(q["id"])
        assert q["profile_id"] == PROFILE_SR
        assert q["company"] is not None
        assert q["company"]["company_name"] == "SR Rénovation"

        # GET to verify persistence
        g = api.get(f"{BASE_URL}/api/quotes/{q['id']}")
        assert g.status_code == 200
        gq = g.json()
        assert gq["company"]["company_name"] == "SR Rénovation"
        assert gq["profile_id"] == PROFILE_SR

    def test_create_quote_without_profile_uses_default(self, api, client_id):
        payload = {
            "client_id": client_id,
            "work_location": f"{TEST_LOCATION_PREFIX} - default profile",
            "services": [_service("Test prestation", 1, 50.0)],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        q = r.json()
        _created_quote_ids.append(q["id"])
        # Default profile is Ugreen
        assert q["profile_id"] == PROFILE_UGREEN
        assert q["company"]["company_name"] == "Câble Ethernet Ugreen"

    def test_update_quote_changes_profile_snapshot(self, api, client_id):
        # Create with Ugreen default
        payload = {
            "client_id": client_id,
            "profile_id": PROFILE_UGREEN,
            "work_location": f"{TEST_LOCATION_PREFIX} - profile switch",
            "services": [_service("Test", 1, 100.0)],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200
        q = r.json()
        _created_quote_ids.append(q["id"])
        assert q["company"]["company_name"] == "Câble Ethernet Ugreen"

        # Switch to SR via PUT
        payload["profile_id"] = PROFILE_SR
        u = api.put(f"{BASE_URL}/api/quotes/{q['id']}", json=payload)
        assert u.status_code == 200, u.text
        uq = u.json()
        assert uq["profile_id"] == PROFILE_SR
        assert uq["company"]["company_name"] == "SR Rénovation"

        # GET confirms persisted change
        g = api.get(f"{BASE_URL}/api/quotes/{q['id']}").json()
        assert g["company"]["company_name"] == "SR Rénovation"


# ─── Dynamic additional_options ───────────────────────────────────
class TestDynamicOptions:
    def test_remise_amount_on_line_recomputes_correctly(self, api, client_id):
        """Line: qty=2 * pu=100 = 200; remise amount 30 → total 170."""
        srv = _service("Ligne remise €", 2, 100.0, remise_type="amount", remise_montant=30.0)
        assert srv["total"] == 170.0
        payload = {
            "client_id": client_id,
            "profile_id": PROFILE_SR,
            "work_location": f"{TEST_LOCATION_PREFIX} - line remise amount",
            "services": [srv],
            "remise_percent": 0, "remise_montant": 0,
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        q = r.json()
        _created_quote_ids.append(q["id"])
        # total_brut server-side = sum(service.total)
        assert q["total_brut"] == 170.0
        assert q["total_net"] == 170.0

    def test_create_quote_with_3_dynamic_options_and_global_amount_remise(self, api, client_id):
        # Option blocks: opt0 (200 brut, remise amount 20 = 180), opt1 (100 brut, remise %10 = 90),
        # opt2 (50 brut, no remise = 50)
        opt0 = {
            "title": "Option Dyn 2",
            "services": [_service("A", 2, 100.0)],
            "remise_type": "amount", "remise_percent": 0, "remise_montant": 20.0,
        }
        opt1 = {
            "title": "Option Dyn 3",
            "services": [_service("B", 1, 100.0)],
            "remise_type": "percent", "remise_percent": 10, "remise_montant": 0,
        }
        opt2 = {
            "title": "Option Dyn 4",
            "services": [_service("C", 1, 50.0)],
            "remise_type": "percent", "remise_percent": 0, "remise_montant": 0,
        }
        payload = {
            "client_id": client_id,
            "profile_id": PROFILE_SR,
            "work_location": f"{TEST_LOCATION_PREFIX} - 3 dyn options",
            "services": [_service("Main", 1, 500.0)],
            "additional_options": [opt0, opt1, opt2],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        q = r.json()
        _created_quote_ids.append(q["id"])

        assert "additional_options" in q
        ao = q["additional_options"]
        assert len(ao) == 3, f"expected 3 dynamic options, got {len(ao)}"

        # opt0: total_brut 200, remise 20, total_net 180
        assert ao[0]["total_brut"] == 200.0
        assert ao[0]["remise"] == 20.0
        assert ao[0]["total_net"] == 180.0
        assert ao[0]["title"] == "Option Dyn 2"

        # opt1: total_brut 100, remise 10 (10% of 100), total_net 90
        assert ao[1]["total_brut"] == 100.0
        assert ao[1]["remise"] == 10.0
        assert ao[1]["total_net"] == 90.0

        # opt2: total_brut 50, no remise, total_net 50
        assert ao[2]["total_brut"] == 50.0
        assert ao[2]["remise"] == 0.0
        assert ao[2]["total_net"] == 50.0

        # Legacy option_2/option_3 should be derived from the first two dynamic options
        assert q["option_2_total_net"] == 180.0
        assert q["option_3_total_net"] == 90.0
        assert q["option_2_title"] == "Option Dyn 2"
        assert q["option_3_title"] == "Option Dyn 3"

        # Verify persistence via GET
        g = api.get(f"{BASE_URL}/api/quotes/{q['id']}").json()
        assert len(g["additional_options"]) == 3
        assert g["additional_options"][0]["total_net"] == 180.0

    def test_line_amount_remise_inside_dynamic_option(self, api, client_id):
        srv = _service("OptLine €", 1, 200.0, remise_type="amount", remise_montant=50.0)
        assert srv["total"] == 150.0
        opt = {
            "title": "Opt with line remise €",
            "services": [srv],
            "remise_type": "percent", "remise_percent": 0, "remise_montant": 0,
        }
        payload = {
            "client_id": client_id,
            "profile_id": PROFILE_SR,
            "work_location": f"{TEST_LOCATION_PREFIX} - opt line amount remise",
            "services": [_service("X", 1, 100.0)],
            "additional_options": [opt],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200, r.text
        q = r.json()
        _created_quote_ids.append(q["id"])
        assert q["additional_options"][0]["total_brut"] == 150.0
        assert q["additional_options"][0]["total_net"] == 150.0

    def test_edit_quote_preserves_dynamic_options(self, api, client_id):
        opt0 = {"title": "Edit Opt", "services": [_service("A", 1, 100.0)],
                "remise_type": "percent", "remise_percent": 0, "remise_montant": 0}
        payload = {
            "client_id": client_id, "profile_id": PROFILE_SR,
            "work_location": f"{TEST_LOCATION_PREFIX} - edit options",
            "services": [_service("Main", 1, 200.0)],
            "additional_options": [opt0],
        }
        r = api.post(f"{BASE_URL}/api/quotes", json=payload)
        assert r.status_code == 200
        q = r.json()
        _created_quote_ids.append(q["id"])
        assert len(q["additional_options"]) == 1

        # Add a second dynamic option via PUT
        payload["additional_options"] = [
            opt0,
            {"title": "Added On Edit", "services": [_service("B", 1, 80.0)],
             "remise_type": "amount", "remise_percent": 0, "remise_montant": 10},
        ]
        u = api.put(f"{BASE_URL}/api/quotes/{q['id']}", json=payload)
        assert u.status_code == 200, u.text
        uq = u.json()
        assert len(uq["additional_options"]) == 2
        assert uq["additional_options"][1]["total_brut"] == 80.0
        assert uq["additional_options"][1]["remise"] == 10.0
        assert uq["additional_options"][1]["total_net"] == 70.0
        # Client and main services preserved
        assert uq["client_id"] == client_id
        assert len(uq["services"]) == 1

        # Remove first option via PUT
        payload["additional_options"] = payload["additional_options"][1:]
        u2 = api.put(f"{BASE_URL}/api/quotes/{q['id']}", json=payload)
        assert u2.status_code == 200
        assert len(u2.json()["additional_options"]) == 1
        assert u2.json()["additional_options"][0]["title"] == "Added On Edit"
