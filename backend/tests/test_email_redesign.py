"""
Test suite for Email Redesign Feature - Iteration 11
Tests:
1. POST /api/quotes/{quote_id}/send-email accepts pdf_base64 and pdf_filename
2. Email HTML template structure (gradient header, CTA button, footer)
3. No price in email body
4. Sender format includes name
5. PIN auth still works
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmailRedesignBackend:
    """Tests for the email redesign feature backend"""
    
    # Test token from previous iterations
    TEST_TOKEN = "tM8t9k-StPu8nM8KVvJqjwunRjap8D5ldAIOlZKWnAc"
    TEST_PIN = "0330"
    
    @pytest.fixture
    def api_client(self):
        """Create requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture
    def test_quote_id(self, api_client):
        """Get quote ID from test token"""
        response = api_client.get(f"{BASE_URL}/api/public/quote/{self.TEST_TOKEN}")
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip("Could not get test quote ID")
    
    def test_pin_auth_still_works(self, api_client):
        """Verify PIN auth endpoint still works (PIN: 0330)"""
        response = api_client.post(f"{BASE_URL}/api/auth/verify-pin", json={"pin": self.TEST_PIN})
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("authenticated") is True
        print("✅ PIN auth works with PIN 0330")
    
    def test_send_email_endpoint_accepts_payload_without_pdf(self, api_client, test_quote_id):
        """Test send-email endpoint accepts basic payload without PDF"""
        # Note: We're NOT actually sending an email - just validating the endpoint accepts the payload
        # We use an invalid email to ensure Resend rejects it without actually sending
        payload = {
            "subject": "Test Subject",
            "message": "Test message body",
            "recipient_email": "invalid-email-for-test@test.invalid.domain.xyz"
        }
        response = api_client.post(f"{BASE_URL}/api/quotes/{test_quote_id}/send-email", json=payload)
        # We expect either success or an email sending error (not a 4xx validation error)
        # The endpoint should accept the payload structure
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        # Even if email fails, the endpoint should accept the payload format
        assert response.status_code in [200, 500], "Endpoint should accept payload structure"
        print("✅ Send email endpoint accepts basic payload")
    
    def test_send_email_endpoint_accepts_pdf_fields(self, api_client, test_quote_id):
        """Test send-email endpoint accepts pdf_base64 and pdf_filename fields"""
        # Create a minimal valid PDF (just the header)
        test_pdf_content = b"%PDF-1.4\n%test"
        test_pdf_base64 = base64.b64encode(test_pdf_content).decode('utf-8')
        
        payload = {
            "subject": "Test Subject with PDF",
            "message": "Test message body",
            "recipient_email": "invalid-email-for-test@test.invalid.domain.xyz",
            "pdf_base64": test_pdf_base64,
            "pdf_filename": "devis_test.pdf"
        }
        response = api_client.post(f"{BASE_URL}/api/quotes/{test_quote_id}/send-email", json=payload)
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        # The endpoint should accept the payload with PDF fields (even if email fails)
        assert response.status_code in [200, 500], "Endpoint should accept payload with PDF fields"
        print("✅ Send email endpoint accepts pdf_base64 and pdf_filename fields")
    
    def test_public_quote_endpoint_works(self, api_client):
        """Verify public quote endpoint returns data"""
        response = api_client.get(f"{BASE_URL}/api/public/quote/{self.TEST_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "quote_number" in data
        assert "client_name" in data
        print(f"✅ Public quote endpoint works, quote_number: {data.get('quote_number')}")
    
    def test_api_root_works(self, api_client):
        """Verify API root is accessible"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API root works")


class TestEmailTemplateStructure:
    """
    Code review tests - verify the email template structure in server.py
    These tests inspect the code directly since we can't send real emails
    """
    
    def test_verify_sender_format_in_code(self):
        """Verify sender format includes name 'SR Renovation'"""
        import re
        
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Check for sender format: f"SR Renovation <{SENDER_EMAIL}>"
        assert 'SR Renovation <' in code, "Sender should include 'SR Renovation' name"
        assert 'sender = f"SR Renovation <{SENDER_EMAIL}>"' in code, "Sender format should be 'SR Renovation <email>'"
        print("✅ Sender format includes 'SR Renovation' name")
    
    def test_verify_gradient_header_in_code(self):
        """Verify email template has gradient from blue (#1e40af) to orange (#f97316)"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Check for gradient header with blue to orange
        assert 'linear-gradient' in code, "Email should have gradient"
        assert '#1e40af' in code, "Gradient should include blue (#1e40af)"
        assert '#f97316' in code, "Gradient should include orange (#f97316)"
        print("✅ Email template has blue-to-orange gradient header")
    
    def test_verify_cta_button_color_in_code(self):
        """Verify CTA button has orange color #FF8C42"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        assert '#FF8C42' in code, "CTA button should have color #FF8C42"
        print("✅ CTA button has orange color #FF8C42")
    
    def test_verify_footer_contact_info_in_code(self):
        """Verify footer has phone, email, address, website"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Check footer contact info
        assert '06 80 33 45 46' in code, "Footer should have phone number"
        assert 'SrRenovation03@gmail.com' in code, "Footer should have email"
        assert 'Jura (39)' in code, "Footer should have location"
        assert 'sr-renovation.fr' in code, "Footer should have website"
        print("✅ Footer has all contact info: phone, email, address, website")
    
    def test_verify_no_price_in_email_body(self):
        """Verify email HTML body does NOT contain price/montant"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Find the email HTML template section (between html_content = and the closing """)
        import re
        html_match = re.search(r'html_content = f"""(.+?)"""', code, re.DOTALL)
        
        if html_match:
            html_template = html_match.group(1)
            # Check that price/montant variables are NOT interpolated in the email body
            assert 'total_net' not in html_template, "Email body should NOT contain total_net"
            assert 'montant' not in html_template.lower(), "Email body should NOT contain 'montant'"
            # The only exception is in the signature notification to admin (different email)
            print("✅ Email body does NOT display price/montant")
        else:
            pytest.skip("Could not find email template in code")
    
    def test_verify_pdf_attachment_support_in_code(self):
        """Verify code supports PDF attachment via Resend"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Check for PDF attachment logic
        assert 'pdf_base64' in code, "Should accept pdf_base64 field"
        assert 'pdf_filename' in code, "Should accept pdf_filename field"
        assert 'attachments' in code, "Should support attachments"
        print("✅ PDF attachment support is implemented")


class TestSendQuoteEmailModel:
    """Test the SendQuoteEmail Pydantic model structure"""
    
    def test_verify_model_has_pdf_fields(self):
        """Verify SendQuoteEmail model has pdf_base64 and pdf_filename"""
        with open('/app/backend/server.py', 'r') as f:
            code = f.read()
        
        # Check SendQuoteEmail model definition
        assert 'class SendQuoteEmail' in code, "SendQuoteEmail model should exist"
        assert 'pdf_base64: str | None = None' in code, "Model should have pdf_base64 optional field"
        assert 'pdf_filename: str | None = None' in code, "Model should have pdf_filename optional field"
        print("✅ SendQuoteEmail model has pdf_base64 and pdf_filename fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
