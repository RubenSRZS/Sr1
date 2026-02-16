"""
Sr-Renovation API Tests
Tests for: Clients CRUD, Quotes (with per-client numbering), Invoices (with acompte/reste calculation),
Catalog CRUD, Stats endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"

# Test client data
TEST_CLIENT_DATA = {
    "name": f"TEST_Client_{uuid.uuid4().hex[:6]}",
    "address": "123 Rue Test, 75001 Paris",
    "phone": "0612345678",
    "email": "",  # Optional email test
    "notes": "Test notes"
}

TEST_CLIENT_WITH_EMAIL = {
    "name": f"TEST_ClientEmail_{uuid.uuid4().hex[:6]}",
    "address": "456 Avenue Test, 69001 Lyon",
    "phone": "0698765432",
    "email": "test@example.com",
    "notes": ""
}


class TestAPIHealth:
    """Test API root endpoint"""
    
    def test_api_root(self):
        response = requests.get(f"{API}/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Sr-Renovation API"
        print("✓ API root endpoint working")


class TestClientsCRUD:
    """Tests for /api/clients endpoints - email is optional"""
    
    def test_create_client_without_email(self):
        """Create client with optional email (empty string)"""
        response = requests.post(f"{API}/clients", json=TEST_CLIENT_DATA)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == TEST_CLIENT_DATA["name"]
        assert data["phone"] == TEST_CLIENT_DATA["phone"]
        assert data["address"] == TEST_CLIENT_DATA["address"]
        assert "id" in data
        assert data["email"] == ""  # Email is empty but should be valid
        print(f"✓ Created client without email: {data['id']}")
        return data["id"]
    
    def test_create_client_with_email(self):
        """Create client with email provided"""
        response = requests.post(f"{API}/clients", json=TEST_CLIENT_WITH_EMAIL)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_CLIENT_WITH_EMAIL["email"]
        print(f"✓ Created client with email: {data['id']}")
        return data["id"]
    
    def test_get_clients_list(self):
        """Get all clients"""
        response = requests.get(f"{API}/clients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} clients")
    
    def test_get_client_by_id(self):
        """Create client then retrieve by ID"""
        # Create
        create_response = requests.post(f"{API}/clients", json={
            "name": f"TEST_GetById_{uuid.uuid4().hex[:6]}",
            "address": "Test Address",
            "phone": "0600000000",
            "email": ""
        })
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Get
        get_response = requests.get(f"{API}/clients/{client_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == client_id
        print(f"✓ Retrieved client by ID: {client_id}")
    
    def test_update_client(self):
        """Create then update client"""
        # Create
        create_response = requests.post(f"{API}/clients", json={
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "address": "Initial Address",
            "phone": "0611111111",
            "email": ""
        })
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "name": "TEST_Updated_Name",
            "address": "Updated Address",
            "phone": "0622222222",
            "email": "updated@test.com"
        }
        update_response = requests.put(f"{API}/clients/{client_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == update_data["name"]
        assert updated["email"] == update_data["email"]
        print(f"✓ Updated client: {client_id}")
    
    def test_delete_client(self):
        """Create then delete client"""
        # Create
        create_response = requests.post(f"{API}/clients", json={
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "address": "Delete Test Address",
            "phone": "0633333333",
            "email": ""
        })
        assert create_response.status_code == 200
        client_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{API}/clients/{client_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{API}/clients/{client_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted client: {client_id}")
    
    def test_get_nonexistent_client(self):
        """Test 404 for non-existent client"""
        response = requests.get(f"{API}/clients/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ 404 for non-existent client")


class TestQuotesWithPerClientNumbering:
    """Tests for quotes with per-client sequential numbering (DEVIS-01, DEVIS-02 per client)"""
    
    @pytest.fixture
    def new_client(self):
        """Create a fresh client for quote testing"""
        response = requests.post(f"{API}/clients", json={
            "name": f"TEST_QuoteClient_{uuid.uuid4().hex[:6]}",
            "address": "Quote Test Address",
            "phone": "0644444444",
            "email": ""
        })
        assert response.status_code == 200
        return response.json()
    
    def test_create_quote_with_existing_client(self, new_client):
        """Create quote for existing client - should get DEVIS-01"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "123 Chantier Test",
            "work_surface": "150m²",
            "services": [
                {"description": "Nettoyage toiture", "quantity": 1, "unit_price": 500, "total": 500},
                {"description": "Traitement anti-mousse", "quantity": 1, "unit_price": 300, "total": 300}
            ],
            "remise_percent": 0,
            "notes": "Test quote"
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify quote number starts with DEVIS-01 for first quote
        assert data["quote_number"] == "DEVIS-01"
        assert data["client_id"] == new_client["id"]
        assert data["client_name"] == new_client["name"]
        assert data["total_brut"] == 800
        assert data["total_net"] == 800
        assert data["acompte_30"] == 240  # 30% of 800
        print(f"✓ Created quote {data['quote_number']} for client")
        return data
    
    def test_per_client_sequential_numbering(self, new_client):
        """Test that quotes are numbered per-client: DEVIS-01, DEVIS-02"""
        # Create first quote
        quote1_data = {
            "client_id": new_client["id"],
            "work_location": "Location 1",
            "services": [{"description": "Service 1", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0
        }
        response1 = requests.post(f"{API}/quotes", json=quote1_data)
        assert response1.status_code == 200
        quote1 = response1.json()
        assert quote1["quote_number"] == "DEVIS-01"
        
        # Create second quote for same client
        quote2_data = {
            "client_id": new_client["id"],
            "work_location": "Location 2",
            "services": [{"description": "Service 2", "quantity": 1, "unit_price": 200, "total": 200}],
            "remise_percent": 0
        }
        response2 = requests.post(f"{API}/quotes", json=quote2_data)
        assert response2.status_code == 200
        quote2 = response2.json()
        assert quote2["quote_number"] == "DEVIS-02"
        
        print(f"✓ Per-client numbering works: {quote1['quote_number']}, {quote2['quote_number']}")
    
    def test_create_quote_with_new_client_inline(self):
        """Create quote with new client created inline (no email)"""
        quote_data = {
            "client_id": None,
            "new_client": {
                "name": f"TEST_InlineClient_{uuid.uuid4().hex[:6]}",
                "address": "Inline Client Address",
                "phone": "0655555555",
                "email": ""  # Optional email
            },
            "work_location": "Inline Chantier",
            "services": [{"description": "Test Service", "quantity": 2, "unit_price": 250, "total": 500}],
            "remise_percent": 10,
            "notes": "Quote with inline client"
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["quote_number"] == "DEVIS-01"  # First quote for new client
        assert data["client_name"] == quote_data["new_client"]["name"]
        assert data["client_email"] == ""
        print(f"✓ Created quote with inline new client: {data['quote_number']}")
    
    def test_percentage_discount_calculation(self, new_client):
        """Test remise percentage: 30% on 1000€ = 300€ discount, net = 700€"""
        quote_data = {
            "client_id": new_client["id"],
            "work_location": "Discount Test",
            "services": [
                {"description": "Service coûteux", "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "remise_percent": 30,  # 30% discount
            "notes": ""
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_brut"] == 1000
        assert data["remise_percent"] == 30
        assert data["remise"] == 300  # 30% of 1000
        assert data["total_net"] == 700  # 1000 - 300
        assert data["acompte_30"] == 210  # 30% of 700
        print(f"✓ Discount calculation correct: {data['remise_percent']}% = -{data['remise']}€, net={data['total_net']}€")
    
    def test_get_quotes_list(self):
        """Get all quotes"""
        response = requests.get(f"{API}/quotes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} quotes")
    
    def test_get_quote_by_id(self, new_client):
        """Create then retrieve quote by ID"""
        # Create
        create_response = requests.post(f"{API}/quotes", json={
            "client_id": new_client["id"],
            "work_location": "Get By ID Test",
            "services": [{"description": "Test", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0
        })
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Get
        get_response = requests.get(f"{API}/quotes/{quote_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == quote_id
        print(f"✓ Retrieved quote by ID: {quote_id}")
    
    def test_delete_quote(self, new_client):
        """Create then delete quote"""
        # Create
        create_response = requests.post(f"{API}/quotes", json={
            "client_id": new_client["id"],
            "work_location": "Delete Test",
            "services": [{"description": "Delete Test", "quantity": 1, "unit_price": 50, "total": 50}],
            "remise_percent": 0
        })
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{API}/quotes/{quote_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{API}/quotes/{quote_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted quote: {quote_id}")


class TestInvoicesWithAcompte:
    """Tests for invoices with acompte_paid and reste_a_payer calculation"""
    
    @pytest.fixture
    def new_client(self):
        """Create a fresh client for invoice testing"""
        response = requests.post(f"{API}/clients", json={
            "name": f"TEST_InvoiceClient_{uuid.uuid4().hex[:6]}",
            "address": "Invoice Test Address",
            "phone": "0666666666",
            "email": ""
        })
        assert response.status_code == 200
        return response.json()
    
    def test_create_invoice_with_acompte(self, new_client):
        """Create invoice with acompte_paid and verify reste_a_payer"""
        invoice_data = {
            "client_id": new_client["id"],
            "work_location": "Invoice Test Location",
            "services": [
                {"description": "Travaux toiture", "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "remise_percent": 0,
            "acompte_paid": 300,  # 300€ deposit paid
            "notes": "Test invoice"
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["invoice_number"] == "FACT-01"
        assert data["total_net"] == 1000
        assert data["acompte_paid"] == 300
        assert data["reste_a_payer"] == 700  # 1000 - 300
        assert data["payment_status"] == "partial"  # partial because acompte > 0 but < total
        print(f"✓ Invoice created: acompte={data['acompte_paid']}€, reste={data['reste_a_payer']}€")
    
    def test_invoice_fully_paid(self, new_client):
        """Create invoice where acompte_paid equals total - should be 'paid' status"""
        invoice_data = {
            "client_id": new_client["id"],
            "work_location": "Fully Paid Test",
            "services": [{"description": "Service complet", "quantity": 1, "unit_price": 500, "total": 500}],
            "remise_percent": 0,
            "acompte_paid": 500,  # Full payment
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["reste_a_payer"] == 0
        assert data["payment_status"] == "paid"
        print(f"✓ Fully paid invoice: status={data['payment_status']}")
    
    def test_invoice_no_acompte(self, new_client):
        """Create invoice with no acompte - should be 'pending' status"""
        invoice_data = {
            "client_id": new_client["id"],
            "work_location": "No Acompte Test",
            "services": [{"description": "Service sans acompte", "quantity": 1, "unit_price": 400, "total": 400}],
            "remise_percent": 0,
            "acompte_paid": 0,
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["reste_a_payer"] == 400
        assert data["payment_status"] == "pending"
        print(f"✓ Pending invoice: status={data['payment_status']}")
    
    def test_create_invoice_with_new_client_inline(self):
        """Create invoice with new client created inline"""
        invoice_data = {
            "client_id": None,
            "new_client": {
                "name": f"TEST_InvoiceInline_{uuid.uuid4().hex[:6]}",
                "address": "Inline Invoice Address",
                "phone": "0677777777",
                "email": ""
            },
            "work_location": "Inline Invoice Location",
            "services": [{"description": "Inline Service", "quantity": 1, "unit_price": 600, "total": 600}],
            "remise_percent": 20,
            "acompte_paid": 100,
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data["invoice_number"] == "FACT-01"
        assert data["total_brut"] == 600
        assert data["remise"] == 120  # 20% of 600
        assert data["total_net"] == 480  # 600 - 120
        assert data["acompte_paid"] == 100
        assert data["reste_a_payer"] == 380  # 480 - 100
        print(f"✓ Invoice with inline client: remise={data['remise']}€, reste={data['reste_a_payer']}€")
    
    def test_per_client_invoice_numbering(self, new_client):
        """Test that invoices are numbered per-client: FACT-01, FACT-02"""
        # First invoice
        inv1_data = {
            "client_id": new_client["id"],
            "work_location": "Location 1",
            "services": [{"description": "Service 1", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0,
            "acompte_paid": 0,
        }
        response1 = requests.post(f"{API}/invoices", json=inv1_data)
        assert response1.status_code == 200
        inv1 = response1.json()
        assert inv1["invoice_number"] == "FACT-01"
        
        # Second invoice
        inv2_data = {
            "client_id": new_client["id"],
            "work_location": "Location 2",
            "services": [{"description": "Service 2", "quantity": 1, "unit_price": 200, "total": 200}],
            "remise_percent": 0,
            "acompte_paid": 0,
        }
        response2 = requests.post(f"{API}/invoices", json=inv2_data)
        assert response2.status_code == 200
        inv2 = response2.json()
        assert inv2["invoice_number"] == "FACT-02"
        
        print(f"✓ Per-client invoice numbering: {inv1['invoice_number']}, {inv2['invoice_number']}")
    
    def test_get_invoices_list(self):
        """Get all invoices"""
        response = requests.get(f"{API}/invoices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} invoices")
    
    def test_delete_invoice(self, new_client):
        """Create then delete invoice"""
        # Create
        create_response = requests.post(f"{API}/invoices", json={
            "client_id": new_client["id"],
            "work_location": "Delete Test",
            "services": [{"description": "Delete", "quantity": 1, "unit_price": 50, "total": 50}],
            "remise_percent": 0,
            "acompte_paid": 0,
        })
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{API}/invoices/{invoice_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{API}/invoices/{invoice_id}")
        assert get_response.status_code == 404
        print(f"✓ Deleted invoice: {invoice_id}")


class TestCatalogCRUD:
    """Tests for catalog service items"""
    
    def test_create_catalog_item(self):
        """Create catalog item"""
        item_data = {
            "category": "Toiture",
            "service_name": f"TEST_Service_{uuid.uuid4().hex[:6]}",
            "description": "Nettoyage haute pression",
            "default_price": 350.00
        }
        response = requests.post(f"{API}/catalog", json=item_data)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == item_data["category"]
        assert data["service_name"] == item_data["service_name"]
        assert data["default_price"] == item_data["default_price"]
        print(f"✓ Created catalog item: {data['id']}")
        return data["id"]
    
    def test_get_catalog_list(self):
        """Get all catalog items"""
        response = requests.get(f"{API}/catalog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} catalog items")
    
    def test_delete_catalog_item(self):
        """Create then delete catalog item"""
        # Create
        create_response = requests.post(f"{API}/catalog", json={
            "category": "Test",
            "service_name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "description": "To be deleted",
            "default_price": 100
        })
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{API}/catalog/{item_id}")
        assert delete_response.status_code == 200
        print(f"✓ Deleted catalog item: {item_id}")


class TestStatsEndpoint:
    """Tests for /api/stats endpoint"""
    
    def test_get_stats(self):
        """Get dashboard statistics"""
        response = requests.get(f"{API}/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_clients" in data
        assert "total_quotes" in data
        assert "total_invoices" in data
        assert "quotes_by_status" in data
        assert "invoices_by_status" in data
        assert "revenue" in data
        
        # Verify types
        assert isinstance(data["total_clients"], int)
        assert isinstance(data["total_quotes"], int)
        assert isinstance(data["quotes_by_status"], dict)
        assert "draft" in data["quotes_by_status"]
        assert "total" in data["revenue"]
        assert "pending" in data["revenue"]
        
        print(f"✓ Stats: {data['total_clients']} clients, {data['total_quotes']} quotes, {data['total_invoices']} invoices")
        print(f"✓ Revenue: total={data['revenue']['total']}€, pending={data['revenue']['pending']}€")


class TestEdgeCases:
    """Edge case tests"""
    
    def test_quote_without_client_fails(self):
        """Creating quote without client_id or new_client should fail"""
        quote_data = {
            "client_id": None,
            "new_client": None,
            "work_location": "No Client Test",
            "services": [{"description": "Test", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 400
        print("✓ Quote without client correctly rejected")
    
    def test_invoice_without_client_fails(self):
        """Creating invoice without client should fail"""
        invoice_data = {
            "client_id": None,
            "new_client": None,
            "work_location": "No Client Test",
            "services": [{"description": "Test", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0,
            "acompte_paid": 0,
        }
        response = requests.post(f"{API}/invoices", json=invoice_data)
        assert response.status_code == 400
        print("✓ Invoice without client correctly rejected")
    
    def test_quote_with_invalid_client_fails(self):
        """Creating quote with non-existent client should fail"""
        quote_data = {
            "client_id": "nonexistent-client-id",
            "work_location": "Invalid Client Test",
            "services": [{"description": "Test", "quantity": 1, "unit_price": 100, "total": 100}],
            "remise_percent": 0
        }
        response = requests.post(f"{API}/quotes", json=quote_data)
        assert response.status_code == 404
        print("✓ Quote with invalid client correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
