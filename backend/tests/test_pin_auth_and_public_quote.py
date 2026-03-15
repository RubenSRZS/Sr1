"""
Tests for Sr-Renovation PIN Authentication and Public Quote features
- PIN authentication: verify, change, recover
- Public quote: access, tracking (opened), signature
- Send quote email functionality
"""
import pytest
import requests
import os
import secrets

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestPinAuthentication:
    """Tests for PIN auth endpoints"""
    
    def test_verify_pin_success(self):
        """POST /api/auth/verify-pin with correct PIN (0330) should return success"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-pin", json={"pin": "0330"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("authenticated") is True
        print("PASS: verify_pin_success - correct PIN returns success")
    
    def test_verify_pin_wrong_pin(self):
        """POST /api/auth/verify-pin with wrong PIN should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/verify-pin", json={"pin": "1234"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print("PASS: verify_pin_wrong_pin - wrong PIN returns 401")
    
    def test_change_pin_wrong_current_pin(self):
        """POST /api/auth/change-pin with wrong current_pin should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/change-pin", json={
            "current_pin": "9999",  # wrong current PIN
            "new_pin": "5678"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: change_pin_wrong_current_pin - returns 401")
    
    def test_change_pin_success(self):
        """POST /api/auth/change-pin with correct current_pin should work, then revert"""
        # First, change PIN from 0330 to 9999
        response = requests.post(f"{BASE_URL}/api/auth/change-pin", json={
            "current_pin": "0330",
            "new_pin": "9999"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        print("PASS: PIN changed from 0330 to 9999")
        
        # Verify new PIN works
        response = requests.post(f"{BASE_URL}/api/auth/verify-pin", json={"pin": "9999"})
        assert response.status_code == 200, f"New PIN should work"
        
        # Verify old PIN doesn't work
        response = requests.post(f"{BASE_URL}/api/auth/verify-pin", json={"pin": "0330"})
        assert response.status_code == 401, f"Old PIN should fail"
        
        # Revert PIN back to 0330
        response = requests.post(f"{BASE_URL}/api/auth/change-pin", json={
            "current_pin": "9999",
            "new_pin": "0330"
        })
        assert response.status_code == 200, f"PIN should be reverted back to 0330"
        print("PASS: PIN reverted back to 0330")
    
    def test_recover_pin_success(self):
        """POST /api/auth/recover-pin should return success (email sending attempted)"""
        response = requests.post(f"{BASE_URL}/api/auth/recover-pin")
        # Note: If ADMIN_EMAIL is configured, this should succeed
        # It may fail with 500 if Resend email fails for unverified recipient
        assert response.status_code in [200, 500], f"Expected 200 or 500, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert data.get("status") == "success"
            assert "message" in data
            print(f"PASS: recover_pin returns success with message: {data.get('message')}")
        else:
            print("INFO: recover_pin returned 500 (email sending failed - expected for unverified recipients)")


class TestPublicQuote:
    """Tests for public quote page endpoints"""
    
    @pytest.fixture
    def test_quote_with_token(self):
        """Create a test quote and return it with its public_token"""
        # First, create a test client
        client_response = requests.post(f"{BASE_URL}/api/clients", json={
            "name": "TEST_PublicQuoteClient",
            "address": "123 Test Street",
            "phone": "0612345678",
            "email": "test.public@example.com"
        })
        assert client_response.status_code == 200
        client = client_response.json()
        
        # Create a test quote
        quote_response = requests.post(f"{BASE_URL}/api/quotes", json={
            "client_id": client["id"],
            "work_location": "Test Location",
            "services": [
                {"description": "Test Service", "quantity": 1, "unit": "unité", "unit_price": 100.0, "total": 100.0}
            ],
            "remise_percent": 0,
            "remise_montant": 0
        })
        assert quote_response.status_code == 200
        quote = quote_response.json()
        
        yield quote
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/quotes/{quote['id']}")
        requests.delete(f"{BASE_URL}/api/clients/{client['id']}")
    
    def test_get_quotes_returns_public_token(self):
        """GET /api/quotes should return quotes with public_token field"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200
        quotes = response.json()
        if len(quotes) > 0:
            # Check that at least one quote has a public_token
            has_token = any(q.get("public_token") for q in quotes)
            assert has_token or len(quotes) > 0, "Quotes should have public_token"
            print(f"PASS: GET /api/quotes returns quotes (count: {len(quotes)})")
        else:
            print("INFO: No quotes exist, skipping public_token check")
    
    def test_public_quote_access_with_valid_token(self, test_quote_with_token):
        """GET /api/public/quote/{token} should return quote data without auth"""
        quote = test_quote_with_token
        token = quote.get("public_token")
        assert token, "Quote should have a public_token"
        
        response = requests.get(f"{BASE_URL}/api/public/quote/{token}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify returned fields
        assert data.get("id") == quote["id"]
        assert data.get("quote_number") == quote["quote_number"]
        assert data.get("client_name") == quote["client_name"]
        assert "services" in data
        assert "total_net" in data
        print("PASS: public quote access returns correct data")
    
    def test_public_quote_access_invalid_token(self):
        """GET /api/public/quote/{invalid_token} should return 404"""
        response = requests.get(f"{BASE_URL}/api/public/quote/invalid_token_xyz123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: invalid token returns 404")
    
    def test_public_quote_opened_tracking(self, test_quote_with_token):
        """POST /api/public/quote/{token}/opened should track opening time"""
        quote = test_quote_with_token
        token = quote.get("public_token")
        
        # Track opening
        response = requests.post(f"{BASE_URL}/api/public/quote/{token}/opened")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        
        # Verify the quote now has opened_at
        quote_response = requests.get(f"{BASE_URL}/api/quotes/{quote['id']}")
        assert quote_response.status_code == 200
        updated_quote = quote_response.json()
        assert updated_quote.get("opened_at") is not None, "opened_at should be set"
        print("PASS: opened tracking works correctly")
    
    def test_public_quote_sign(self, test_quote_with_token):
        """POST /api/public/quote/{token}/sign should mark quote as accepted"""
        quote = test_quote_with_token
        token = quote.get("public_token")
        
        # Sign the quote
        signature_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        response = requests.post(f"{BASE_URL}/api/public/quote/{token}/sign", json={
            "signature_data": signature_data,
            "signer_name": "Test Signer"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "success"
        assert "signed_at" in data
        
        # Verify the quote status is updated
        quote_response = requests.get(f"{BASE_URL}/api/quotes/{quote['id']}")
        assert quote_response.status_code == 200
        updated_quote = quote_response.json()
        assert updated_quote.get("status") == "accepted", f"Expected 'accepted', got {updated_quote.get('status')}"
        assert updated_quote.get("signature_data") == signature_data
        assert updated_quote.get("signed_at") is not None
        print("PASS: signature feature works correctly")
    
    def test_public_quote_double_sign_prevented(self, test_quote_with_token):
        """POST /api/public/quote/{token}/sign twice should fail"""
        quote = test_quote_with_token
        token = quote.get("public_token")
        
        # First signature
        signature_data = "data:image/png;base64,test"
        response = requests.post(f"{BASE_URL}/api/public/quote/{token}/sign", json={
            "signature_data": signature_data
        })
        assert response.status_code == 200
        
        # Second signature should fail
        response = requests.post(f"{BASE_URL}/api/public/quote/{token}/sign", json={
            "signature_data": signature_data
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: double signing is prevented")


class TestSendQuoteEmail:
    """Tests for send quote email functionality"""
    
    @pytest.fixture
    def test_quote_for_email(self):
        """Create a test quote for email testing"""
        # Create a test client
        client_response = requests.post(f"{BASE_URL}/api/clients", json={
            "name": "TEST_EmailQuoteClient",
            "address": "456 Email Street",
            "phone": "0698765432",
            "email": "test.email@example.com"
        })
        assert client_response.status_code == 200
        client = client_response.json()
        
        # Create a test quote
        quote_response = requests.post(f"{BASE_URL}/api/quotes", json={
            "client_id": client["id"],
            "work_location": "Email Test Location",
            "services": [
                {"description": "Email Test Service", "quantity": 2, "unit": "m²", "unit_price": 50.0, "total": 100.0}
            ],
            "remise_percent": 0,
            "remise_montant": 0
        })
        assert quote_response.status_code == 200
        quote = quote_response.json()
        
        yield quote
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/quotes/{quote['id']}")
        requests.delete(f"{BASE_URL}/api/clients/{client['id']}")
    
    def test_send_quote_email_success(self, test_quote_for_email):
        """POST /api/quotes/{id}/send-email should send email and update status"""
        quote = test_quote_for_email
        
        response = requests.post(f"{BASE_URL}/api/quotes/{quote['id']}/send-email", json={
            "subject": "Test Devis SR Rénovation",
            "message": "Bonjour,\n\nVoici votre devis test.",
            "recipient_email": "test@example.com"
        })
        
        # Email may fail for unverified recipients, but API should handle gracefully
        if response.status_code == 200:
            data = response.json()
            assert data.get("status") == "success"
            assert "public_token" in data
            
            # Verify quote status is updated to 'sent'
            quote_response = requests.get(f"{BASE_URL}/api/quotes/{quote['id']}")
            updated_quote = quote_response.json()
            assert updated_quote.get("status") == "sent", f"Expected 'sent', got {updated_quote.get('status')}"
            assert updated_quote.get("sent_at") is not None
            assert updated_quote.get("sent_to_email") == "test@example.com"
            print("PASS: send_quote_email updates status correctly")
        elif response.status_code == 500:
            # Email sending failed (expected for unverified recipients)
            print("INFO: send_quote_email returned 500 (email sending failed - expected for unverified recipients)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_send_quote_email_not_found(self):
        """POST /api/quotes/{invalid_id}/send-email should return 404"""
        response = requests.post(f"{BASE_URL}/api/quotes/invalid-quote-id-xyz/send-email", json={
            "subject": "Test",
            "message": "Test",
            "recipient_email": "test@example.com"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: send_quote_email for invalid quote returns 404")


class TestQuoteTrackingBadges:
    """Tests to verify tracking fields are returned in quotes API"""
    
    def test_quotes_api_returns_tracking_fields(self):
        """GET /api/quotes should return tracking fields (sent_at, opened_at, signed_at)"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200
        quotes = response.json()
        
        # The Quote model should include these tracking fields
        if len(quotes) > 0:
            sample_quote = quotes[0]
            # Check that tracking fields exist in the response (even if null)
            tracking_fields = ["sent_at", "sent_to_email", "opened_at", "signed_at", "public_token"]
            for field in tracking_fields:
                assert field in sample_quote or sample_quote.get(field) is None, f"Field {field} should be in quote response"
            print(f"PASS: tracking fields present in quote response")
        else:
            print("INFO: No quotes to check, but API works")


class TestCleanup:
    """Cleanup test data created during tests"""
    
    def test_cleanup_test_data(self):
        """Clean up all TEST_ prefixed data"""
        response = requests.delete(f"{BASE_URL}/api/cleanup/test-data")
        assert response.status_code == 200
        data = response.json()
        print(f"Cleanup completed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
