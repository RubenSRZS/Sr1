"""
Test suite for catalog colors and diagnostic functionality for Sr-Renovation.fr
Testing critical UX bugs:
1) Catalog items should have colors populated (not null)
2) Backend /api/quotes should accept diagnostic as dict (not rigid Pydantic model)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCatalogColors:
    """Test that catalog items return proper color values"""
    
    def test_catalog_endpoint_returns_items(self):
        """Test /api/catalog returns items"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Catalog should have items"
        print(f"PASS: Catalog has {len(data)} items")
        
    def test_catalog_items_have_colors(self):
        """Test that all catalog items have color field populated (not null)"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        items = response.json()
        
        # Define expected colors by category
        expected_colors = {
            'TOITURE': '#3b82f6',          # blue
            'FAÇADE': '#f97316',            # orange
            'ZINGUERIE & HABILLAGE': '#10b981',  # green
            'SOLS & EXTÉRIEURS': '#8b5cf6', # purple
        }
        
        items_without_color = []
        items_with_wrong_color = []
        
        for item in items:
            category = item.get('category')
            color = item.get('color')
            
            if color is None:
                items_without_color.append(f"{item['service_name']} ({category})")
            elif category in expected_colors and color != expected_colors[category]:
                items_with_wrong_color.append(f"{item['service_name']}: expected {expected_colors[category]}, got {color}")
        
        if items_without_color:
            pytest.fail(f"Items with null color: {items_without_color}")
        
        if items_with_wrong_color:
            print(f"WARN: Items with different colors: {items_with_wrong_color}")
        
        print(f"PASS: All {len(items)} catalog items have colors")
        
    def test_catalog_colors_match_categories(self):
        """Test that colors match expected category colors"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        items = response.json()
        
        category_colors = {
            'TOITURE': '#3b82f6',
            'FAÇADE': '#f97316',
            'ZINGUERIE & HABILLAGE': '#10b981',
            'SOLS & EXTÉRIEURS': '#8b5cf6',
        }
        
        for item in items:
            category = item.get('category')
            color = item.get('color')
            expected = category_colors.get(category)
            
            if expected:
                assert color == expected, f"Item '{item['service_name']}' in {category} has color {color}, expected {expected}"
        
        print("PASS: All catalog colors match their category")


class TestQuoteDiagnostic:
    """Test that quotes accept diagnostic as plain dict"""
    
    @pytest.fixture
    def test_client_id(self):
        """Create test client and return ID"""
        client_data = {
            "name": "TEST_DiagnosticClient",
            "address": "123 Test Diagnostic Street",
            "phone": "0600000000",
            "email": "test@diagnostic.com"
        }
        response = requests.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_create_quote_with_diagnostic_dict(self, test_client_id):
        """Test creating a quote with diagnostic as a plain dict (not Pydantic model)"""
        # Diagnostic with grouped sub-options
        diagnostic_data = {
            "gouttieres_obstruee": True,
            "gouttieres_encrassee": True,
            "vegetation_mousses": True,
            "facade_fissures": True
        }
        
        quote_data = {
            "client_id": test_client_id,
            "work_location": "123 Test Work Location",
            "work_surface": "100m²",
            "diagnostic": diagnostic_data,
            "services": [
                {
                    "description": "Test service for diagnostic",
                    "quantity": 1.0,
                    "unit": "forfait",
                    "unit_price": 100.0,
                    "remise_percent": 0,
                    "total": 100.0
                }
            ],
            "remise_percent": 0,
            "remise_montant": 0,
            "payment_plan": "acompte_solde"
        }
        
        response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        
        # This should NOT fail - diagnostic should be accepted as dict
        assert response.status_code == 200, f"Failed to create quote with diagnostic: {response.text}"
        
        quote = response.json()
        assert "diagnostic" in quote
        assert quote["diagnostic"] is not None
        assert quote["diagnostic"]["gouttieres_obstruee"] == True
        assert quote["diagnostic"]["gouttieres_encrassee"] == True
        
        print("PASS: Quote created successfully with diagnostic as dict")
        return quote["id"]
    
    def test_get_quote_returns_diagnostic(self, test_client_id):
        """Test that GET /api/quotes/{id} returns the diagnostic dict"""
        # First create a quote with diagnostic
        diagnostic_data = {
            "structure_tuiles_cassees": True,
            "vegetation_mousses": True,
            "humidite_forte": True
        }
        
        quote_data = {
            "client_id": test_client_id,
            "work_location": "456 Test Location",
            "diagnostic": diagnostic_data,
            "services": [
                {
                    "description": "Test service",
                    "quantity": 1.0,
                    "unit": "unité",
                    "unit_price": 50.0,
                    "remise_percent": 0,
                    "total": 50.0
                }
            ],
            "remise_percent": 0,
            "remise_montant": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Now GET the quote and verify diagnostic
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.status_code == 200
        
        quote = get_response.json()
        assert "diagnostic" in quote
        assert quote["diagnostic"]["structure_tuiles_cassees"] == True
        assert quote["diagnostic"]["vegetation_mousses"] == True
        assert quote["diagnostic"]["humidite_forte"] == True
        
        print("PASS: GET quote returns diagnostic dict correctly")
    
    def test_update_quote_with_diagnostic(self, test_client_id):
        """Test updating quote with modified diagnostic"""
        # Create initial quote
        quote_data = {
            "client_id": test_client_id,
            "work_location": "789 Test Location",
            "diagnostic": {"gouttieres_obstruee": True},
            "services": [
                {
                    "description": "Initial service",
                    "quantity": 1.0,
                    "unit": "unité",
                    "unit_price": 75.0,
                    "remise_percent": 0,
                    "total": 75.0
                }
            ],
            "remise_percent": 0,
            "remise_montant": 0
        }
        
        create_response = requests.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert create_response.status_code == 200
        quote_id = create_response.json()["id"]
        
        # Update with new diagnostic
        updated_diagnostic = {
            "gouttieres_obstruee": True,
            "gouttieres_encrassee": True,
            "facade_fissures": True
        }
        
        update_data = {
            "client_id": test_client_id,
            "work_location": "789 Test Location Updated",
            "diagnostic": updated_diagnostic,
            "services": quote_data["services"],
            "remise_percent": 0,
            "remise_montant": 0
        }
        
        update_response = requests.put(f"{BASE_URL}/api/quotes/{quote_id}", json=update_data)
        assert update_response.status_code == 200, f"Failed to update quote: {update_response.text}"
        
        updated_quote = update_response.json()
        assert updated_quote["diagnostic"]["gouttieres_obstruee"] == True
        assert updated_quote["diagnostic"]["gouttieres_encrassee"] == True
        assert updated_quote["diagnostic"]["facade_fissures"] == True
        
        print("PASS: Quote updated successfully with new diagnostic")


class TestCleanup:
    """Clean up test data"""
    
    def test_cleanup_test_data(self):
        """Remove TEST_ prefixed data"""
        response = requests.delete(f"{BASE_URL}/api/cleanup/test-data")
        assert response.status_code == 200
        result = response.json()
        print(f"PASS: Cleaned up - clients: {result['deleted']['clients']}, quotes: {result['deleted']['quotes']}")
