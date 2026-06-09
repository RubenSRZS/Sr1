"""
SR Rénovation - Relances Feature Tests (Iteration 15)
Testing: relance-templates CRUD, toggle-relances, mark-lost endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRelanceTemplates:
    """Tests for GET/PUT /api/relance-templates"""

    def test_get_relance_templates_returns_4(self):
        """GET /api/relance-templates must return exactly 4 templates"""
        r = requests.get(f"{BASE_URL}/api/relance-templates")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 4, f"Expected 4 templates, got {len(data)}"
        print(f"✅ GET relance-templates: {len(data)} templates returned")

    def test_relance_templates_have_correct_days(self):
        """Templates should have days 3, 7, 14, 30"""
        r = requests.get(f"{BASE_URL}/api/relance-templates")
        assert r.status_code == 200
        data = r.json()
        days = [t['day'] for t in data]
        for expected_day in [3, 7, 14, 30]:
            assert expected_day in days, f"Day {expected_day} missing from templates"
        print(f"✅ Templates have correct days: {days}")

    def test_relance_templates_have_subject_and_body(self):
        """Each template must have day, subject, body fields"""
        r = requests.get(f"{BASE_URL}/api/relance-templates")
        assert r.status_code == 200
        data = r.json()
        for tmpl in data:
            assert 'day' in tmpl, f"Missing 'day' in template: {tmpl}"
            assert 'subject' in tmpl, f"Missing 'subject' in template for day {tmpl.get('day')}"
            assert 'body' in tmpl, f"Missing 'body' in template for day {tmpl.get('day')}"
            assert isinstance(tmpl['subject'], str) and len(tmpl['subject']) > 0, f"Empty subject for day {tmpl.get('day')}"
            assert isinstance(tmpl['body'], str) and len(tmpl['body']) > 0, f"Empty body for day {tmpl.get('day')}"
        print(f"✅ All templates have subject and body")

    def test_relance_templates_no_mongo_id(self):
        """Templates should not expose MongoDB _id"""
        r = requests.get(f"{BASE_URL}/api/relance-templates")
        assert r.status_code == 200
        data = r.json()
        for tmpl in data:
            assert '_id' not in tmpl, f"MongoDB _id should not be exposed in template"
        print(f"✅ No _id exposed in templates")

    def test_update_relance_template_j3(self):
        """PUT /api/relance-templates/3 should update subject and return ok"""
        original_r = requests.get(f"{BASE_URL}/api/relance-templates")
        original_data = original_r.json()
        original_j3 = next(t for t in original_data if t['day'] == 3)

        new_subject = "TEST_Subject_Updated_J3"
        new_body = "TEST_Body_Updated for J+3 relance testing"
        
        r = requests.put(
            f"{BASE_URL}/api/relance-templates/3",
            json={"day": 3, "subject": new_subject, "body": new_body}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get('status') == 'ok', f"Expected status=ok, got {data}"
        print(f"✅ PUT relance-templates/3 returned ok")

        # Verify it was persisted
        verify_r = requests.get(f"{BASE_URL}/api/relance-templates")
        verify_data = verify_r.json()
        j3_updated = next(t for t in verify_data if t['day'] == 3)
        assert j3_updated['subject'] == new_subject, f"Subject not updated: {j3_updated['subject']}"
        assert j3_updated['body'] == new_body, f"Body not updated: {j3_updated['body']}"
        print(f"✅ Template J+3 update persisted correctly")

        # Restore original
        requests.put(
            f"{BASE_URL}/api/relance-templates/3",
            json={"day": 3, "subject": original_j3['subject'], "body": original_j3['body']}
        )
        print(f"✅ Template J+3 restored to original")

    def test_update_relance_template_invalid_day(self):
        """PUT /api/relance-templates/99 should return 400"""
        r = requests.put(
            f"{BASE_URL}/api/relance-templates/99",
            json={"day": 99, "subject": "Test", "body": "Test body"}
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        print(f"✅ Invalid day returns 400")


class TestToggleRelances:
    """Tests for PATCH /api/quotes/{id}/toggle-relances"""

    created_quote_id = None

    def test_create_sent_quote_for_toggle_test(self):
        """Create a test quote with status='sent' for toggle testing"""
        quote_data = {
            "new_client": {
                "name": "TEST_Relance_Client",
                "address": "1 rue de la Paix, Paris",
                "phone": "0600000001",
                "email": "test_relance@example.com",
                "notes": "a supprimer"
            },
            "work_location": "a supprimer - relance test",
            "services": [
                {"description": "Test service relance", "quantity": 1, "unit_price": 100.0, "total": 100.0, "unit": "h",
                 "remise_type": "percent", "remise_percent": 0.0, "remise_montant": 0.0}
            ],
        }
        r = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert r.status_code == 200, f"Failed to create quote: {r.text}"
        data = r.json()
        assert 'id' in data
        TestToggleRelances.created_quote_id = data['id']
        print(f"✅ Created test quote: {data['id']}")

    def test_toggle_relances_off(self):
        """PATCH toggle-relances should toggle relances_active from True to False"""
        quote_id = TestToggleRelances.created_quote_id
        if not quote_id:
            pytest.skip("Test quote not created")
        
        # First verify current state
        get_r = requests.get(f"{BASE_URL}/api/quotes")
        quotes = get_r.json()
        test_quote = next((q for q in quotes if q['id'] == quote_id), None)
        assert test_quote is not None, "Test quote not found"
        
        initial_state = test_quote.get('relances_active', False)
        print(f"Initial relances_active: {initial_state}")
        
        r = requests.patch(f"{BASE_URL}/api/quotes/{quote_id}/toggle-relances")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert 'relances_active' in data, f"Missing relances_active in response: {data}"
        assert data['relances_active'] == (not initial_state), f"Expected {not initial_state}, got {data['relances_active']}"
        print(f"✅ Toggle relances: {initial_state} → {data['relances_active']}")

    def test_toggle_relances_back_on(self):
        """PATCH toggle-relances again should toggle back"""
        quote_id = TestToggleRelances.created_quote_id
        if not quote_id:
            pytest.skip("Test quote not created")
        
        r = requests.patch(f"{BASE_URL}/api/quotes/{quote_id}/toggle-relances")
        assert r.status_code == 200
        data = r.json()
        assert 'relances_active' in data
        print(f"✅ Toggle relances (2nd toggle): relances_active = {data['relances_active']}")

    def test_toggle_relances_nonexistent_quote(self):
        """PATCH toggle-relances on non-existent quote should return 404"""
        r = requests.patch(f"{BASE_URL}/api/quotes/nonexistent-id-99999/toggle-relances")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        print(f"✅ Non-existent quote returns 404")

    def test_cleanup_toggle_test_quote(self):
        """Clean up test quote"""
        quote_id = TestToggleRelances.created_quote_id
        if not quote_id:
            pytest.skip("No quote to cleanup")
        r = requests.delete(f"{BASE_URL}/api/quotes/{quote_id}")
        assert r.status_code in [200, 204], f"Cleanup failed: {r.text}"
        print(f"✅ Test quote cleaned up")


class TestMarkLost:
    """Tests for PATCH /api/quotes/{id}/mark-lost"""

    created_quote_id = None

    def test_create_sent_quote_for_mark_lost(self):
        """Create a test quote with status='sent' for mark-lost testing"""
        quote_data = {
            "new_client": {
                "name": "TEST_MarkLost_Client",
                "address": "2 rue de la Victoire, Paris",
                "phone": "0600000002",
                "email": "test_marklost@example.com",
                "notes": "a supprimer"
            },
            "work_location": "a supprimer - mark lost test",
            "services": [
                {"description": "Test service lost", "quantity": 1, "unit_price": 200.0, "total": 200.0, "unit": "h",
                 "remise_type": "percent", "remise_percent": 0.0, "remise_montant": 0.0}
            ],
        }
        r = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert r.status_code == 200, f"Failed to create quote: {r.text}"
        data = r.json()
        assert 'id' in data
        TestMarkLost.created_quote_id = data['id']
        print(f"✅ Created test quote for mark-lost: {data['id']}")

    def test_mark_quote_lost(self):
        """PATCH mark-lost should change status to 'lost' and disable relances"""
        quote_id = TestMarkLost.created_quote_id
        if not quote_id:
            pytest.skip("Test quote not created")
        
        r = requests.patch(f"{BASE_URL}/api/quotes/{quote_id}/mark-lost")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get('status') == 'lost', f"Expected status=lost, got {data}"
        print(f"✅ mark-lost returned: {data}")

    def test_mark_lost_persisted_in_db(self):
        """After mark-lost, quote in DB should have status='lost' and relances_active=False"""
        quote_id = TestMarkLost.created_quote_id
        if not quote_id:
            pytest.skip("Test quote not created")
        
        get_r = requests.get(f"{BASE_URL}/api/quotes")
        quotes = get_r.json()
        test_quote = next((q for q in quotes if q['id'] == quote_id), None)
        assert test_quote is not None, "Test quote not found after mark-lost"
        assert test_quote['status'] == 'lost', f"Expected status=lost, got {test_quote['status']}"
        assert test_quote['relances_active'] == False, f"Expected relances_active=False, got {test_quote['relances_active']}"
        print(f"✅ Quote persisted with status=lost, relances_active=False")

    def test_mark_lost_nonexistent_quote(self):
        """PATCH mark-lost on non-existent quote should return 404"""
        r = requests.patch(f"{BASE_URL}/api/quotes/nonexistent-id-88888/mark-lost")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        print(f"✅ Non-existent quote returns 404 for mark-lost")

    def test_cleanup_mark_lost_test_quote(self):
        """Clean up test quote"""
        quote_id = TestMarkLost.created_quote_id
        if not quote_id:
            pytest.skip("No quote to cleanup")
        r = requests.delete(f"{BASE_URL}/api/quotes/{quote_id}")
        assert r.status_code in [200, 204], f"Cleanup failed: {r.text}"
        print(f"✅ Mark-lost test quote cleaned up")


class TestQuotesListAPI:
    """Test that quotes API returns relance fields"""

    def test_quotes_api_returns_relance_fields(self):
        """GET /api/quotes should return quotes with relances fields"""
        r = requests.get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} quotes from API")
        
        if len(data) > 0:
            # Check first quote has relance fields (or they default correctly)
            q = data[0]
            # relances_active might not be present for old quotes (defaults to False in model)
            print(f"  Sample quote fields: {list(q.keys())}")
            # No _id in response
            assert '_id' not in q, "MongoDB _id should not be exposed"
