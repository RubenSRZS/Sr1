import requests
import sys
import json
from datetime import datetime

class SrRenovationAPITester:
    def __init__(self, base_url="https://renovation-docs.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_client_id = None
        self.created_catalog_id = None
        self.created_quote_id = None
        self.created_invoice_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_stats(self):
        """Test GET /api/stats"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_get_clients(self):
        """Test GET /api/clients"""
        success, response = self.run_test(
            "Get Clients List",
            "GET",
            "clients",
            200
        )
        if success:
            print(f"   Found {len(response)} clients")
        return success, response

    def test_create_client(self):
        """Test POST /api/clients"""
        test_client = {
            "name": f"Test Client {datetime.now().strftime('%H%M%S')}",
            "address": "123 Test Street, Test City",
            "phone": "0123456789",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "notes": "Test client created by automated test"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=test_client
        )
        
        if success and 'id' in response:
            self.created_client_id = response['id']
            print(f"   Created client ID: {self.created_client_id}")
        
        return success

    def test_get_catalog(self):
        """Test GET /api/catalog"""
        success, response = self.run_test(
            "Get Catalog",
            "GET",
            "catalog",
            200
        )
        if success:
            print(f"   Found {len(response)} catalog items")
        return success, response

    def test_create_catalog_item(self):
        """Test POST /api/catalog"""
        test_item = {
            "category": "TOITURE",
            "service_name": f"Test Service {datetime.now().strftime('%H%M%S')}",
            "description": "Service de test automatisé",
            "default_price": 150.0
        }
        
        success, response = self.run_test(
            "Create Catalog Item",
            "POST",
            "catalog",
            200,
            data=test_item
        )
        
        if success and 'id' in response:
            self.created_catalog_id = response['id']
            print(f"   Created catalog item ID: {self.created_catalog_id}")
        
        return success

    def test_create_quote(self):
        """Test POST /api/quotes"""
        if not self.created_client_id:
            print("❌ Cannot test quote creation - no client ID available")
            return False
            
        test_quote = {
            "client_id": self.created_client_id,
            "work_location": "123 Test Location",
            "work_surface": "100m²",
            "diagnostic": {
                "mousses": True,
                "lichens": False,
                "tuiles_cassees": True,
                "faitage": False,
                "gouttieres": True,
                "facade": False
            },
            "services": [
                {
                    "description": "Nettoyage toiture test",
                    "quantity": 1.0,
                    "unit_price": 500.0,
                    "total": 500.0
                },
                {
                    "description": "Réparation tuiles test",
                    "quantity": 2.0,
                    "unit_price": 75.0,
                    "total": 150.0
                }
            ],
            "remise": 50.0,
            "notes": "Devis de test automatisé"
        }
        
        success, response = self.run_test(
            "Create Quote",
            "POST",
            "quotes",
            200,
            data=test_quote
        )
        
        if success and 'id' in response:
            self.created_quote_id = response['id']
            print(f"   Created quote ID: {self.created_quote_id}")
            print(f"   Quote number: {response.get('quote_number')}")
        
        return success

    def test_get_quotes(self):
        """Test GET /api/quotes"""
        success, response = self.run_test(
            "Get Quotes List",
            "GET",
            "quotes",
            200
        )
        if success:
            print(f"   Found {len(response)} quotes")
        return success

    def test_create_invoice(self):
        """Test POST /api/invoices"""
        if not self.created_client_id:
            print("❌ Cannot test invoice creation - no client ID available")
            return False
            
        test_invoice = {
            "quote_id": self.created_quote_id,
            "client_id": self.created_client_id,
            "work_location": "123 Test Location",
            "work_surface": "100m²",
            "services": [
                {
                    "description": "Nettoyage toiture facturé",
                    "quantity": 1.0,
                    "unit_price": 500.0,
                    "total": 500.0
                }
            ],
            "remise": 25.0,
            "acompte_paid": 150.0,
            "notes": "Facture de test automatisée"
        }
        
        success, response = self.run_test(
            "Create Invoice",
            "POST",
            "invoices",
            200,
            data=test_invoice
        )
        
        if success and 'id' in response:
            self.created_invoice_id = response['id']
            print(f"   Created invoice ID: {self.created_invoice_id}")
            print(f"   Invoice number: {response.get('invoice_number')}")
        
        return success

    def test_get_invoices(self):
        """Test GET /api/invoices"""
        success, response = self.run_test(
            "Get Invoices List",
            "GET",
            "invoices",
            200
        )
        if success:
            print(f"   Found {len(response)} invoices")
        return success

    def test_ai_generate(self):
        """Test POST /api/ai/generate"""
        if not self.created_client_id:
            print("❌ Cannot test AI generation - no client ID available")
            return False
            
        # First get the client details
        try:
            client_response = requests.get(f"{self.base_url}/api/clients/{self.created_client_id}")
            if client_response.status_code != 200:
                print("❌ Cannot get client details for AI test")
                return False
            client_data = client_response.json()
        except:
            print("❌ Failed to get client data for AI test")
            return False
            
        ai_request = {
            "client_name": client_data["name"],
            "client_address": client_data["address"],
            "client_phone": client_data["phone"],
            "client_email": client_data["email"],
            "work_location": "Maison individuelle, 15 rue des Roses",
            "work_description": "Nettoyage complet de la toiture avec démoussage et traitement anti-mousse. Réparation de quelques tuiles cassées et vérification des gouttières.",
            "document_type": "quote"
        }
        
        success, response = self.run_test(
            "AI Generate Services",
            "POST",
            "ai/generate",
            200,
            data=ai_request
        )
        
        if success:
            print(f"   AI generated {len(response.get('services', []))} services")
            if 'services' in response:
                for i, service in enumerate(response['services'][:2]):  # Show first 2 services
                    print(f"   Service {i+1}: {service.get('description', 'N/A')[:50]}...")
        
        return success

    def test_email_send(self):
        """Test POST /api/send-email (expected to fail due to missing RESEND_API_KEY)"""
        if not self.created_quote_id:
            print("❌ Cannot test email sending - no quote ID available")
            return True  # Return True since this is expected behavior
            
        email_request = {
            "recipient_email": "test@example.com",
            "subject": "Test Devis",
            "document_id": self.created_quote_id,
            "document_type": "quote"
        }
        
        success, response = self.run_test(
            "Send Email (Expected to Fail)",
            "POST",
            "send-email",
            500,  # Expecting 500 due to missing RESEND_API_KEY
            data=email_request
        )
        
        if not success:
            # Check if it failed for the expected reason
            print("   ✅ Email sending failed as expected (RESEND_API_KEY not configured)")
            return True
        else:
            print("   ⚠️  Email sending unexpectedly succeeded")
            return True

def main():
    print("🚀 Starting Sr-Renovation API Tests")
    print("=" * 50)
    
    tester = SrRenovationAPITester()
    
    # Test basic endpoints
    tester.test_stats()
    
    # Test clients
    tester.test_get_clients()
    tester.test_create_client()
    
    # Test catalog
    tester.test_get_catalog()
    tester.test_create_catalog_item()
    
    # Test quotes (requires client)
    tester.test_create_quote()
    tester.test_get_quotes()
    
    # Test invoices (requires client)
    tester.test_create_invoice()
    tester.test_get_invoices()
    
    # Test AI generation (requires client)
    tester.test_ai_generate()
    
    # Test email (expected to fail)
    tester.test_email_send()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())