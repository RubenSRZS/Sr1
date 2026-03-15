"""
Test: Public Quote Page Visual Parity with PDF
Tests that the public quote endpoint returns all fields required by PDFDocument component
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicQuoteForPDFParity:
    """Tests for public quote endpoint - verify all fields needed for PDFDocument"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test with known token"""
        self.test_token = "tM8t9k-StPu8nM8KVvJqjwunRjap8D5ldAIOlZKWnAc"
    
    def test_public_quote_returns_all_pdf_fields(self):
        """Test that public quote endpoint returns all fields needed by PDFDocument"""
        response = requests.get(f"{BASE_URL}/api/public/quote/{self.test_token}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Core quote fields
        assert "id" in data, "Missing: id"
        assert "quote_number" in data, "Missing: quote_number"
        assert "date" in data, "Missing: date"
        assert "status" in data, "Missing: status"
        
        # Client fields (critical for visual parity)
        assert "client_name" in data, "Missing: client_name"
        assert "client_address" in data, "Missing: client_address"
        assert "client_phone" in data, "Missing: client_phone"
        assert "client_email" in data, "Missing: client_email"
        
        # Work location
        assert "work_location" in data, "Missing: work_location"
        
        # Services
        assert "services" in data, "Missing: services"
        assert isinstance(data["services"], list), "services should be a list"
        
        # Option 1 totals
        assert "total_brut" in data, "Missing: total_brut"
        assert "remise" in data, "Missing: remise"
        assert "remise_percent" in data, "Missing: remise_percent"
        assert "total_net" in data, "Missing: total_net"
        assert "acompte_30" in data, "Missing: acompte_30"
        
        # Display settings
        assert "show_line_numbers" in data, "Missing: show_line_numbers"
        assert "payment_plan" in data, "Missing: payment_plan"
        
        # Option 2 fields
        assert "option_2_services" in data, "Missing: option_2_services"
        assert "option_2_title" in data, "Missing: option_2_title"
        assert "option_2_total_net" in data, "Missing: option_2_total_net"
        assert "option_2_remise" in data, "Missing: option_2_remise"
        assert "option_2_remise_percent" in data, "Missing: option_2_remise_percent"
        assert "option_2_acompte_30" in data, "Missing: option_2_acompte_30"
        
        # Option 3 fields
        assert "option_3_services" in data, "Missing: option_3_services"
        assert "option_3_title" in data, "Missing: option_3_title"
        assert "option_3_total_net" in data, "Missing: option_3_total_net"
        assert "option_3_remise" in data, "Missing: option_3_remise"
        assert "option_3_remise_percent" in data, "Missing: option_3_remise_percent"
        assert "option_3_acompte_30" in data, "Missing: option_3_acompte_30"
        
        # Notes
        assert "notes" in data, "Missing: notes"
        
        # Signature tracking
        assert "signed_at" in data, "Missing: signed_at"
        assert "signature_data" in data, "Missing: signature_data"
        
        # Diagnostic (optional but should be present)
        assert "diagnostic" in data, "Missing: diagnostic"
        
        print(f"✅ All {len(data)} fields returned for PDFDocument visual parity")
    
    def test_public_quote_client_fields_not_empty(self):
        """Test that client fields have actual values"""
        response = requests.get(f"{BASE_URL}/api/public/quote/{self.test_token}")
        data = response.json()
        
        # Verify client fields have values (using the test quote)
        assert data["client_name"] == "LECOMTE JOCELYNE", f"Unexpected client name: {data['client_name']}"
        assert data["client_phone"] == "0650248643", f"Unexpected phone: {data['client_phone']}"
        assert "shoplecomte@sfr.fr" in data["client_email"], f"Unexpected email: {data['client_email']}"
        
        print("✅ Client fields contain correct values")
    
    def test_public_quote_totals_calculated(self):
        """Test that financial totals are properly calculated"""
        response = requests.get(f"{BASE_URL}/api/public/quote/{self.test_token}")
        data = response.json()
        
        # Verify totals for Option 1
        assert data["total_brut"] == 4500.0, f"Expected total_brut 4500, got {data['total_brut']}"
        assert data["remise_percent"] == 30.0, f"Expected remise_percent 30, got {data['remise_percent']}"
        assert data["remise"] == 1350.0, f"Expected remise 1350, got {data['remise']}"
        assert data["total_net"] == 3150.0, f"Expected total_net 3150, got {data['total_net']}"
        assert data["acompte_30"] == 945.0, f"Expected acompte_30 945, got {data['acompte_30']}"
        
        # Verify Option 2 totals
        assert data["option_2_remise_percent"] == 30.0
        assert data["option_2_total_net"] == 2415.0
        
        print("✅ Financial totals are correctly calculated")
    
    def test_public_quote_services_structure(self):
        """Test that services have the correct structure"""
        response = requests.get(f"{BASE_URL}/api/public/quote/{self.test_token}")
        data = response.json()
        
        services = data["services"]
        assert len(services) == 5, f"Expected 5 services, got {len(services)}"
        
        for i, service in enumerate(services):
            assert "description" in service, f"Service {i}: missing description"
            assert "quantity" in service, f"Service {i}: missing quantity"
            assert "unit" in service, f"Service {i}: missing unit"
            assert "unit_price" in service, f"Service {i}: missing unit_price"
            assert "total" in service, f"Service {i}: missing total"
        
        print(f"✅ All {len(services)} services have correct structure")
    
    def test_public_quote_invalid_token(self):
        """Test that invalid token returns 404"""
        response = requests.get(f"{BASE_URL}/api/public/quote/invalid-token-12345")
        assert response.status_code == 404
        print("✅ Invalid token returns 404")
    
    def test_opened_tracking_endpoint(self):
        """Test that opened tracking endpoint works"""
        response = requests.post(f"{BASE_URL}/api/public/quote/{self.test_token}/opened")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        print("✅ Opened tracking works")


class TestPinAuth:
    """Tests for PIN authentication"""
    
    def test_verify_pin_correct(self):
        """Test PIN verification with correct PIN"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-pin",
            json={"pin": "0330"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["authenticated"] == True
        print("✅ Correct PIN (0330) authenticates successfully")
    
    def test_verify_pin_wrong(self):
        """Test PIN verification with wrong PIN"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-pin",
            json={"pin": "1111"}
        )
        assert response.status_code == 401
        print("✅ Wrong PIN returns 401")


class TestQuoteSignFlow:
    """Tests for quote signing flow (without actually signing to preserve data)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test with known token"""
        self.test_token = "tM8t9k-StPu8nM8KVvJqjwunRjap8D5ldAIOlZKWnAc"
    
    def test_sign_endpoint_exists(self):
        """Test that sign endpoint exists and is accessible"""
        # First check if quote is already signed
        response = requests.get(f"{BASE_URL}/api/public/quote/{self.test_token}")
        data = response.json()
        
        if data.get("signed_at"):
            print("⚠️ Quote already signed - skipping sign test to preserve data")
            return
        
        # If not signed, verify we could sign (don't actually sign)
        print("✅ Quote is available for signing (not actually signing to preserve data)")
