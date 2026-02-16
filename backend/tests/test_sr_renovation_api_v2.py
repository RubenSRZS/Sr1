"""
Sr-Renovation API Tests V2 - Iteration 2
Tests for NEW FEATURES:
- remise_montant (flat amount discount) vs remise_percent 
- Diagnostic field on quotes (visible on PDF)
- Invoice remise_montant support
- Per-client numbering (regression)
- Acompte/reste_a_payer calculations (regression)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"


class TestAPIHealth:
    """Test API root endpoint"""
    
    def test_api_root(self):
        response = requests.get(f"{API}/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Sr-Renovation API"
        print("✓ API root endpoint working")


class TestFlatAmountDiscountQuotes:
    """NEW FEATURE: Tests for remise_montant (flat € discount) on quotes"""
    
    @pytest.fixture
    def new_client(self):
        """Create a fresh client for testing"""
        response = requests.post(f"{API}/clients", json={
            "name": f"TEST_FlatDiscount_{uuid.uuid4().hex[:6]}",
            "address": "Flat Discount Test Address",
            "phone": "0612340001",
            "email": ""
        })
        assert response.status_code == 200
        return response.json()
    
    def test_quote_flat_discount_200_on_1690(self, new_client):
        """Test flat discount: 200€ flat on 1690€ total = 1490€ net"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Flat Discount Test Location",
            "services": [
                {"description": "Service A", "quantity": 1, "unit_price": 1000, "total": 1000},
                {"description": "Service B", "quantity": 1, "unit_price": 690, "total": 690}
            ],
            "remise_percent": 0,  # No percentage discount
            "remise_montant": 200,  # Flat 200€ discount
            "notes": "Test flat discount"
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_brut"] == 1690
        assert data["remise_percent"] == 0
        assert data["remise_montant"] == 200
        assert data["remise"] == 200  # Flat discount applied
        assert data["total_net"] == 1490  # 1690 - 200
        assert data["acompte_30"] == 447  # 30% of 1490
        print(f"✓ Flat discount: 200€ on 1690€ = net {data['total_net']}€")
    
    def test_quote_percentage_discount_10_on_1000(self, new_client):
        """Test percentage discount: 10% on 1000€ = 100€ off, net = 900€"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Percentage Discount Test",
            "services": [
                {"description": "Single Service", "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "remise_percent": 10,  # 10% discount
            "remise_montant": 0,  # No flat discount
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_brut"] == 1000
        assert data["remise_percent"] == 10
        assert data["remise_montant"] == 0
        assert data["remise"] == 100  # 10% of 1000
        assert data["total_net"] == 900  # 1000 - 100
        print(f"✓ Percentage discount: 10% on 1000€ = -{data['remise']}€, net={data['total_net']}€")
    
    def test_quote_percentage_takes_priority_over_flat(self, new_client):
        """When remise_percent > 0, it takes priority over remise_montant"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Priority Test",
            "services": [
                {"description": "Test Service", "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "remise_percent": 20,  # 20% = 200€ discount
            "remise_montant": 500,  # This should be ignored
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        # Percentage should take priority
        assert data["remise"] == 200  # 20% of 1000, not 500€ flat
        assert data["total_net"] == 800  # 1000 - 200
        print(f"✓ Percentage priority: remise={data['remise']}€ (not 500€)")
    
    def test_quote_no_discount(self, new_client):
        """Test with no discount (both 0)"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "No Discount Test",
            "services": [
                {"description": "Test Service", "quantity": 1, "unit_price": 500, "total": 500}
            ],
            "remise_percent": 0,
            "remise_montant": 0,
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["remise"] == 0
        assert data["total_net"] == 500
        print(f"✓ No discount: total_net={data['total_net']}€")


class TestDiagnosticOnQuotes:
    """NEW FEATURE: Tests for diagnostic field on quotes"""
    
    @pytest.fixture
    def new_client(self):
        """Create a fresh client for testing"""
        response = requests.post(f"{API}/clients", json={
            "name": f"TEST_Diagnostic_{uuid.uuid4().hex[:6]}",
            "address": "Diagnostic Test Address",
            "phone": "0612340002",
            "email": ""
        })
        assert response.status_code == 200
        return response.json()
    
    def test_quote_with_diagnostic_checked(self, new_client):
        """Create quote with diagnostic checkboxes checked"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Diagnostic Test Location",
            "diagnostic": {
                "mousses": True,
                "lichens": True,
                "tuiles_cassees": False,
                "faitage": True,
                "gouttieres": False,
                "facade": False
            },
            "services": [
                {"description": "Nettoyage", "quantity": 1, "unit_price": 500, "total": 500}
            ],
            "remise_percent": 0,
            "remise_montant": 0,
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify diagnostic is stored
        assert data["diagnostic"] is not None
        assert data["diagnostic"]["mousses"] == True
        assert data["diagnostic"]["lichens"] == True
        assert data["diagnostic"]["tuiles_cassees"] == False
        assert data["diagnostic"]["faitage"] == True
        assert data["diagnostic"]["gouttieres"] == False
        assert data["diagnostic"]["facade"] == False
        print(f"✓ Diagnostic stored: mousses={data['diagnostic']['mousses']}, lichens={data['diagnostic']['lichens']}, faitage={data['diagnostic']['faitage']}")
    
    def test_quote_without_diagnostic(self, new_client):
        """Create quote without diagnostic field"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "No Diagnostic Test",
            "services": [
                {"description": "Service", "quantity": 1, "unit_price": 300, "total": 300}
            ],
            "remise_percent": 0,
            "remise_montant": 0,
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        # Diagnostic should be None or have default values
        print(f"✓ Quote created without diagnostic: {data.get('diagnostic')}")
    
    def test_quote_diagnostic_persists_after_get(self, new_client):
        """Create quote with diagnostic and verify it persists when retrieved"""
        # Create
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Diagnostic Persist Test",
            "diagnostic": {
                "mousses": True,
                "lichens": False,
                "tuiles_cassees": True,
                "faitage": False,
                "gouttieres": True,
                "facade": False
            },
            "services": [
                {"description": "Service", "quantity": 1, "unit_price": 400, "total": 400}
            ],
            "remise_percent": 0,
            "remise_montant": 0,
        }
        create_response = requests.post(f"{API}/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Get and verify
        get_response = requests.get(f"{API}/quotes/{quote_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["diagnostic"]["mousses"] == True
        assert data["diagnostic"]["tuiles_cassees"] == True
        assert data["diagnostic"]["gouttieres"] == True
        print(f"✓ Diagnostic persisted after GET")


class TestFlatAmountDiscountInvoices:
    """NEW FEATURE: Tests for remise_montant on invoices"""
    
    @pytest.fixture
    def new_client(self):
        """Create a fresh client for testing"""
        response = requests.post(f"{API}/clients", json={
            "name": f"TEST_InvFlatDiscount_{uuid.uuid4().hex[:6]}",
            "address": "Invoice Flat Discount Address",
            "phone": "0612340003",
            "email": ""
        })
        assert response.status_code == 200
        return response.json()
    
    def test_invoice_flat_discount_with_acompte(self, new_client):
        """Test invoice with flat discount and acompte_paid"""
        invoice_data = {
            "client_id": new_client["id"],
            "work_location": "Invoice Flat Discount Test",
            "services": [
                {"description": "Service", "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "remise_percent": 0,
            "remise_montant": 150,  # Flat 150€ discount
            "acompte_paid": 200,
            "notes": ""
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_brut"] == 1000
        assert data["remise_montant"] == 150
        assert data["remise"] == 150  # Flat discount
        assert data["total_net"] == 850  # 1000 - 150
        assert data["acompte_paid"] == 200
        assert data["reste_a_payer"] == 650  # 850 - 200
        print(f"✓ Invoice flat discount: {data['remise']}€ off, reste={data['reste_a_payer']}€")
    
    def test_invoice_percentage_discount(self, new_client):
        """Test invoice with percentage discount"""
        invoice_data = {
            "client_id": new_client["id"],
            "work_location": "Invoice Percentage Test",
            "services": [
                {"description": "Service", "quantity": 1, "unit_price": 2000, "total": 2000}
            ],
            "remise_percent": 10,  # 10% discount
            "remise_montant": 0,
            "acompte_paid": 500,
            "notes": ""
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_brut"] == 2000
        assert data["remise"] == 200  # 10% of 2000
        assert data["total_net"] == 1800  # 2000 - 200
        assert data["reste_a_payer"] == 1300  # 1800 - 500
        print(f"✓ Invoice percentage discount: {data['remise_percent']}% = -{data['remise']}€")


class TestPerClientNumbering:
    """Regression: Per-client numbering still works"""
    
    def test_new_client_starts_at_01(self):
        """New client's first quote should be DEVIS-01"""
        # Create new client
        client_response = requests.post(f"{API}/clients", json={
            "name": f"TEST_Numbering_{uuid.uuid4().hex[:6]}",
            "address": "Numbering Test",
            "phone": "0612340004",
            "email": ""
        })
        assert client_response.status_code == 200
        client = client_response.json()
        
        # Create first quote
        quote_response = requests.post(f"{API}/quotes", json={
            "client_id": client["id"],
            "work_location": "Test",
            "services": [{"description": "S", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0,
            "remise_montant": 0,
        })
        assert quote_response.status_code == 200
        quote = quote_response.json()
        
        assert quote["quote_number"] == "DEVIS-01"
        print(f"✓ First quote for new client: {quote['quote_number']}")
    
    def test_new_client_invoice_starts_at_01(self):
        """New client's first invoice should be FACT-01"""
        # Create new client
        client_response = requests.post(f"{API}/clients", json={
            "name": f"TEST_InvNum_{uuid.uuid4().hex[:6]}",
            "address": "Invoice Numbering Test",
            "phone": "0612340005",
            "email": ""
        })
        assert client_response.status_code == 200
        client = client_response.json()
        
        # Create first invoice
        invoice_response = requests.post(f"{API}/invoices", json={
            "client_id": client["id"],
            "work_location": "Test",
            "services": [{"description": "S", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0,
            "remise_montant": 0,
            "acompte_paid": 0,
        })
        assert invoice_response.status_code == 200
        invoice = invoice_response.json()
        
        assert invoice["invoice_number"] == "FACT-01"
        print(f"✓ First invoice for new client: {invoice['invoice_number']}")


class TestNewClientInlineCreation:
    """Regression: Creating quotes/invoices with new client inline"""
    
    def test_quote_with_inline_client_optional_email(self):
        """Create quote with new client inline (optional email)"""
        quote_data = {
            "client_id": None,
            "new_client": {
                "name": f"TEST_InlineQuote_{uuid.uuid4().hex[:6]}",
                "address": "123 Rue Test",
                "phone": "0612340006",
                "email": ""  # Optional email
            },
            "work_location": "Inline Client Location",
            "diagnostic": {"mousses": True, "lichens": False, "tuiles_cassees": False, "faitage": False, "gouttieres": False, "facade": False},
            "services": [{"description": "Service", "quantity": 1, "unit_price": 500, "total": 500}],
            "remise_percent": 0,
            "remise_montant": 100,  # Flat discount
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["quote_number"] == "DEVIS-01"
        assert data["client_email"] == ""
        assert data["remise"] == 100
        assert data["total_net"] == 400  # 500 - 100
        print(f"✓ Quote with inline client created: {data['quote_number']}")
    
    def test_invoice_with_inline_client_with_email(self):
        """Create invoice with new client inline (with email)"""
        invoice_data = {
            "client_id": None,
            "new_client": {
                "name": f"TEST_InlineInvoice_{uuid.uuid4().hex[:6]}",
                "address": "456 Avenue Test",
                "phone": "0612340007",
                "email": "inline@test.com"
            },
            "work_location": "Inline Invoice Location",
            "services": [{"description": "Service", "quantity": 1, "unit_price": 800, "total": 800}],
            "remise_percent": 0,
            "remise_montant": 50,
            "acompte_paid": 100,
            "notes": ""
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["invoice_number"] == "FACT-01"
        assert data["client_email"] == "inline@test.com"
        assert data["remise"] == 50
        assert data["total_net"] == 750  # 800 - 50
        assert data["reste_a_payer"] == 650  # 750 - 100
        print(f"✓ Invoice with inline client created: {data['invoice_number']}")


class TestStatsEndpoint:
    """Regression: Stats endpoint still works"""
    
    def test_get_stats(self):
        """Get dashboard statistics"""
        response = requests.get(f"{API}/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_clients" in data
        assert "total_quotes" in data
        assert "total_invoices" in data
        assert "revenue" in data
        print(f"✓ Stats: {data['total_clients']} clients, {data['total_quotes']} quotes, revenue={data['revenue']['total']}€")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
