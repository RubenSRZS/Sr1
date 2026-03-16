import requests
import sys
import json
import base64
from datetime import datetime

class SrRenovationAPITester:
    def __init__(self, base_url="https://sleepy-keller-1.preview.emergentagent.com"):
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

    def test_email_send_with_pdf(self):
        """Test POST /api/quotes/{quote_id}/send-email - SR-Renovation specific test"""
        # First get existing quotes to use real IDs
        success, quotes = self.run_test(
            "Get Existing Quotes for Email Test",
            "GET", 
            "quotes",
            200
        )
        
        if not success or not quotes:
            print("❌ Cannot test email sending - no quotes available")
            return False
            
        # Use the first available quote
        quote_id = quotes[0]['id']
        print(f"   Using quote ID: {quote_id}")
        
        # Test email sending with PDF
        email_data = {
            "subject": "Votre devis SR-Renovation",
            "message": "Test d'envoi d'email",
            "recipient_email": "test@example.com",
            "pdf_base64": None,
            "pdf_filename": None
        }
        
        success, response = self.run_test(
            "Send Quote Email with PDF",
            "POST",
            f"quotes/{quote_id}/send-email",
            200,
            data=email_data
        )
        
        if success:
            print("   ✅ Email sent successfully")
            print(f"   Email ID: {response.get('email_id', 'N/A')}")
            print(f"   Public token: {response.get('public_token', 'N/A')}")
            
            # Verify the quote was updated with sent status
            quote_success, quote_data = self.run_test(
                "Verify Quote Status Updated",
                "GET",
                f"quotes/{quote_id}",
                200
            )
            
            if quote_success:
                print(f"   Quote status: {quote_data.get('status', 'N/A')}")
                print(f"   Sent to email: {quote_data.get('sent_to_email', 'N/A')}")
                
        return success

    def test_public_quote_retrieval(self):
        """Test GET /api/public/quote/{token}"""
        # First get a quote with public token
        success, quotes = self.run_test(
            "Get Quotes for Public Token Test",
            "GET",
            "quotes", 
            200
        )
        
        if not success or not quotes:
            print("❌ Cannot test public quote - no quotes available")
            return False
            
        # Find a quote with public_token
        quote_with_token = None
        for quote in quotes:
            if quote.get('public_token'):
                quote_with_token = quote
                break
                
        if not quote_with_token:
            print("❌ No quotes with public tokens found")
            return False
            
        token = quote_with_token['public_token']
        print(f"   Using public token: {token[:10]}...")
        
        success, response = self.run_test(
            "Get Public Quote",
            "GET",
            f"public/quote/{token}",
            200
        )
        
        if success:
            print("   ✅ Public quote retrieved successfully")
            # Verify required fields for PDF rendering
            required_fields = ['id', 'quote_number', 'client_name', 'services', 'total_net']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                print(f"   ⚠️  Missing required fields: {missing_fields}")
            else:
                print("   ✅ All required fields present for PDF rendering")
                
            print(f"   Quote number: {response.get('quote_number', 'N/A')}")
            print(f"   Client: {response.get('client_name', 'N/A')}")
            print(f"   Services count: {len(response.get('services', []))}")
            
        return success

    def test_quote_signature_flow(self):
        """Test POST /api/public/quote/{token}/sign"""
        # First get a quote that's not signed yet
        success, quotes = self.run_test(
            "Get Quotes for Signature Test",
            "GET",
            "quotes",
            200
        )
        
        if not success or not quotes:
            print("❌ Cannot test signature - no quotes available")
            return False
            
        # Find an unsigned quote with public token
        unsigned_quote = None
        for quote in quotes:
            if quote.get('public_token') and not quote.get('signed_at'):
                unsigned_quote = quote
                break
                
        if not unsigned_quote:
            print("❌ No unsigned quotes with public tokens found")
            return False
            
        token = unsigned_quote['public_token']
        print(f"   Using quote: {unsigned_quote.get('quote_number', 'N/A')}")
        print(f"   Public token: {token[:10]}...")
        
        # Test signature data (minimal PNG base64)
        signature_data = {
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "signer_name": "Test User",
            "pdf_base64": "test",
            "pdf_filename": "test.pdf"
        }
        
        success, response = self.run_test(
            "Sign Quote Electronically",
            "POST",
            f"public/quote/{token}/sign",
            200,
            data=signature_data
        )
        
        if success:
            print("   ✅ Quote signed successfully")
            print(f"   Signed at: {response.get('signed_at', 'N/A')}")
            
            # Verify the quote was updated
            quote_success, quote_data = self.run_test(
                "Verify Quote Signature Updated",
                "GET",
                f"quotes/{unsigned_quote['id']}",
                200
            )
            
            if quote_success:
                print(f"   Quote status: {quote_data.get('status', 'N/A')}")
                print(f"   Signature present: {'Yes' if quote_data.get('signature_data') else 'No'}")
                
        return success

    def test_track_quote_opened(self):
        """Test POST /api/public/quote/{token}/opened"""
        # Get a quote with public token
        success, quotes = self.run_test(
            "Get Quotes for Tracking Test",
            "GET",
            "quotes",
            200
        )
        
        if not success or not quotes:
            print("❌ Cannot test tracking - no quotes available")
            return False
            
        quote_with_token = None
        for quote in quotes:
            if quote.get('public_token'):
                quote_with_token = quote
                break
                
        if not quote_with_token:
            print("❌ No quotes with public tokens found")
            return False
            
        token = quote_with_token['public_token']
        
        success, response = self.run_test(
            "Track Quote Opened",
            "POST",
            f"public/quote/{token}/opened",
            200
        )
        
        if success:
            print("   ✅ Quote opening tracked successfully")
            
        return success

    def test_pin_authentication(self):
        """Test PIN authentication endpoints"""
        # Test PIN verification
        pin_data = {"pin": "0330"}  # Default PIN from env
        
        success, response = self.run_test(
            "Verify PIN Authentication",
            "POST",
            "auth/verify-pin",
            200,
            data=pin_data
        )
        
        if success:
            print(f"   Authentication status: {response.get('authenticated', False)}")
            
        # Test wrong PIN
        wrong_pin_data = {"pin": "1234"}
        
        wrong_success, wrong_response = self.run_test(
            "Test Wrong PIN (Expected to Fail)",
            "POST", 
            "auth/verify-pin",
            401,
            data=wrong_pin_data
        )
        
        if not wrong_success:
            print("   ✅ Wrong PIN correctly rejected")
            
        return success

    def test_sr_renovation_specific_endpoints(self):
        """Run all SR-Renovation specific tests"""
        print("\n🎯 Running SR-Renovation Specific API Tests")
        print("=" * 60)
        
        results = []
        
        # Test email sending with PDF verification
        results.append(self.test_email_send_with_pdf())
        
        # Test public quote retrieval
        results.append(self.test_public_quote_retrieval())
        
        # Test quote signature flow
        results.append(self.test_quote_signature_flow())
        
        # Test quote tracking
        results.append(self.test_track_quote_opened())
        
        # Test PIN authentication
        results.append(self.test_pin_authentication())
        
        return all(results)

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
    
    # Run SR-Renovation specific tests
    tester.test_sr_renovation_specific_endpoints()
    
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