"""
Sr-Renovation API Tests - Iteration 7
Testing: CRUD operations, Invoice Payment Status, and API functionality
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Basic API health check"""
    
    def test_api_root_accessible(self):
        """Test that API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root accessible: {data}")


class TestClientsAPI:
    """Test Clients CRUD"""
    
    def test_create_client(self):
        """Create a new test client"""
        client_data = {
            "name": "TEST_Client_" + datetime.now().strftime("%H%M%S"),
            "address": "123 Test Street, Paris",
            "phone": "0600112233",
            "email": "test@example.com",
            "notes": "Client de test"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["name"] == client_data["name"]
        assert "id" in data
        print(f"✅ Client created: {data['id']}")
        return data["id"]
    
    def test_get_clients(self):
        """Get all clients"""
        response = requests.get(f"{BASE_URL}/api/clients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} clients")


class TestCatalogAPI:
    """Test Catalog CRUD - Check descriptions are empty"""
    
    def test_get_catalog(self):
        """Get catalog and verify items exist"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} catalog items")
        
        # Check if descriptions are empty (as per requirement)
        if len(data) > 0:
            for item in data[:5]:  # Check first 5 items
                print(f"   - {item['service_name']}: description='{item.get('description', '')}' (len={len(item.get('description', ''))})")
        return data
    
    def test_create_catalog_item(self):
        """Create a catalog item"""
        item_data = {
            "category": "TOITURE",
            "service_name": "TEST_Service_" + datetime.now().strftime("%H%M%S"),
            "description": "",  # Empty description as per requirement
            "default_price": 150.0,
            "default_unit": "m²"
        }
        response = requests.post(f"{BASE_URL}/api/catalog", json=item_data)
        assert response.status_code == 200
        data = response.json()
        assert data["service_name"] == item_data["service_name"]
        assert "id" in data
        print(f"✅ Catalog item created: {data['id']}")
        return data["id"]


class TestQuotesAPI:
    """Test Quotes CRUD"""
    
    @pytest.fixture(autouse=True)
    def setup_client(self):
        """Create a client for testing quotes"""
        client_data = {
            "name": "TEST_Quote_Client",
            "address": "456 Quote Street, Lyon",
            "phone": "0600223344",
            "email": "quote@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        if response.status_code == 200:
            self.client_id = response.json()["id"]
        else:
            # Use existing client
            clients = requests.get(f"{BASE_URL}/api/clients").json()
            self.client_id = clients[0]["id"] if clients else None
    
    def test_create_quote_with_diagnostic(self):
        """Create a quote with enriched diagnostic fields"""
        if not hasattr(self, 'client_id') or not self.client_id:
            pytest.skip("No client available")
        
        quote_data = {
            "client_id": self.client_id,
            "work_location": "789 Test Location",
            "diagnostic": {
                # Gouttières (enriched)
                "gouttieres": True,
                "gouttieres_obstruees": True,
                "gouttieres_encrassees": False,
                "gouttieres_rouille": True,
                "gouttieres_deformees": False,
                "gouttieres_decollees": True,
                "descente_ep": True,
                # PC tôle
                "pc_tole": True,
                "pc_tole_rouille": True,
                "pc_tole_perfore": False,
                "pc_tole_joint": True,
                # Façade
                "facade": True,
                "facade_fissures": True,
                "facade_mousse": True
            },
            "services": [
                {
                    "description": "Nettoyage gouttières",
                    "quantity": 20,
                    "unit": "ML",
                    "unit_price": 15,
                    "remise_percent": 0,
                    "total": 300
                }
            ],
            "remise_percent": 0,
            "payment_plan": "acompte_solde"
        }
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify diagnostic fields
        assert data["diagnostic"]["gouttieres"] == True
        assert data["diagnostic"]["gouttieres_obstruees"] == True
        assert data["diagnostic"]["gouttieres_rouille"] == True
        assert data["diagnostic"]["pc_tole_joint"] == True
        assert data["diagnostic"]["facade_fissures"] == True
        assert data["diagnostic"]["facade_mousse"] == True
        
        print(f"✅ Quote created with enriched diagnostic: {data['id']}")
        return data["id"]
    
    def test_get_quotes(self):
        """Get all quotes"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} quotes")


class TestInvoicesAPI:
    """Test Invoices CRUD and Payment Status"""
    
    @pytest.fixture(autouse=True)
    def setup_client(self):
        """Create a client for testing invoices"""
        client_data = {
            "name": "TEST_Invoice_Client",
            "address": "321 Invoice Street, Marseille",
            "phone": "0600334455",
            "email": "invoice@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        if response.status_code == 200:
            self.client_id = response.json()["id"]
        else:
            clients = requests.get(f"{BASE_URL}/api/clients").json()
            self.client_id = clients[0]["id"] if clients else None
    
    def test_create_invoice(self):
        """Create a test invoice"""
        if not hasattr(self, 'client_id') or not self.client_id:
            pytest.skip("No client available")
        
        invoice_data = {
            "client_id": self.client_id,
            "work_location": "Test Work Location",
            "services": [
                {
                    "description": "Test service",
                    "quantity": 1,
                    "unit": "unité",
                    "unit_price": 500,
                    "remise_percent": 0,
                    "total": 500
                }
            ],
            "remise_percent": 0,
            "acompte_paid": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["payment_status"] == "pending"
        assert data["reste_a_payer"] == 500
        print(f"✅ Invoice created: {data['id']}, status={data['payment_status']}")
        return data["id"]
    
    def test_get_invoices(self):
        """Get all invoices"""
        response = requests.get(f"{BASE_URL}/api/invoices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} invoices")
        return data
    
    def test_mark_invoice_as_paid(self):
        """Test PATCH /api/invoices/{id}/payment - Mark as paid"""
        if not hasattr(self, 'client_id') or not self.client_id:
            pytest.skip("No client available")
        
        # First create an invoice
        invoice_data = {
            "client_id": self.client_id,
            "work_location": "Payment Test Location",
            "services": [
                {
                    "description": "Payment test service",
                    "quantity": 1,
                    "unit": "unité",
                    "unit_price": 1000,
                    "remise_percent": 0,
                    "total": 1000
                }
            ],
            "remise_percent": 0,
            "acompte_paid": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        assert create_response.status_code == 200
        invoice_id = create_response.json()["id"]
        
        # Test PATCH endpoint - Mark as paid
        patch_response = requests.patch(f"{BASE_URL}/api/invoices/{invoice_id}/payment?payment_status=paid")
        assert patch_response.status_code == 200, f"Failed: {patch_response.text}"
        patch_data = patch_response.json()
        assert patch_data["status"] == "success"
        assert patch_data["payment_status"] == "paid"
        print(f"✅ Invoice {invoice_id} marked as paid")
        
        # Verify the update
        get_response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}")
        assert get_response.status_code == 200
        invoice_data = get_response.json()
        assert invoice_data["payment_status"] == "paid"
        assert invoice_data["reste_a_payer"] == 0
        assert invoice_data["acompte_paid"] == 1000  # Should equal total_net
        print(f"✅ Invoice verified: payment_status={invoice_data['payment_status']}, reste={invoice_data['reste_a_payer']}")
        
        return invoice_id
    
    def test_mark_invoice_as_pending(self):
        """Test PATCH /api/invoices/{id}/payment - Mark as pending (revert from paid)"""
        if not hasattr(self, 'client_id') or not self.client_id:
            pytest.skip("No client available")
        
        # Create and mark as paid first
        invoice_data = {
            "client_id": self.client_id,
            "work_location": "Revert Test Location",
            "services": [
                {
                    "description": "Revert test service",
                    "quantity": 1,
                    "unit": "unité",
                    "unit_price": 800,
                    "remise_percent": 0,
                    "total": 800
                }
            ],
            "remise_percent": 0,
            "acompte_paid": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/invoices", json=invoice_data)
        invoice_id = create_response.json()["id"]
        
        # Mark as paid
        requests.patch(f"{BASE_URL}/api/invoices/{invoice_id}/payment?payment_status=paid")
        
        # Mark as pending (revert)
        patch_response = requests.patch(f"{BASE_URL}/api/invoices/{invoice_id}/payment?payment_status=pending")
        assert patch_response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}")
        invoice_data = get_response.json()
        assert invoice_data["payment_status"] == "pending"
        assert invoice_data["reste_a_payer"] == 800  # Should equal total_net
        assert invoice_data["acompte_paid"] == 0
        print(f"✅ Invoice reverted to pending: reste={invoice_data['reste_a_payer']}")


class TestStatsAPI:
    """Test Stats endpoint"""
    
    def test_get_stats(self):
        """Get dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_clients" in data
        assert "total_quotes" in data
        assert "total_invoices" in data
        assert "quotes_by_status" in data
        assert "invoices_by_status" in data
        assert "revenue" in data
        
        print(f"✅ Stats: clients={data['total_clients']}, quotes={data['total_quotes']}, invoices={data['total_invoices']}")
        print(f"   Revenue: total={data['revenue']['total']}, pending={data['revenue']['pending']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
