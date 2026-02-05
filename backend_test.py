#!/usr/bin/env python3
"""
Fluxy Logistique Backend API Test Suite
Tests all endpoints for the logistics delivery application
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FluxyAPITester:
    def __init__(self, base_url: str = "https://fluxy-mongo-api.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.business_token = None
        self.driver_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data
        self.admin_credentials = {
            "email": "admin@fluxylogistique.com",
            "password": "admin123"
        }
        
        self.test_business = {
            "email": f"test_business_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "name": "Test Business",
            "business_name": "Test Logistics Co",
            "business_address": "123 Test Street, Test City"
        }
        
        self.test_driver = {
            "phone": f"22670{datetime.now().strftime('%H%M%S')}",
            "password": "TestPass123!",
            "name": "Test Driver"
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            if not success:
                print(f"    Expected {expected_status}, got {response.status_code}")
                print(f"    Response: {response_data}")
            
            return success, response_data
            
        except Exception as e:
            print(f"    Request failed: {str(e)}")
            return False, {"error": str(e)}

    def test_api_health(self):
        """Test API health check"""
        success, response = self.make_request('GET', '/')
        expected_message = "Fluxy Logistique API - Livraison d'articles lourds"
        
        if success and response.get('message') == expected_message:
            self.log_test("API Health Check", True, f"Message: {response.get('message')}")
        else:
            self.log_test("API Health Check", False, f"Unexpected response: {response}")

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.make_request(
            'POST', 
            '/auth/admin/login', 
            self.admin_credentials
        )
        
        if success and 'session_token' in response:
            self.admin_token = response['session_token']
            user = response.get('user', {})
            if user.get('role') == 'admin' and user.get('email') == self.admin_credentials['email']:
                self.log_test("Admin Login", True, f"Token: {self.admin_token[:20]}...")
            else:
                self.log_test("Admin Login", False, f"Invalid user data: {user}")
        else:
            self.log_test("Admin Login", False, f"Login failed: {response}")

    def test_admin_dashboard(self):
        """Test admin dashboard (requires auth)"""
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token available")
            return
        
        success, response = self.make_request('GET', '/admin/dashboard', token=self.admin_token)
        
        if success:
            required_keys = ['deliveries', 'drivers', 'businesses', 'revenue']
            if all(key in response for key in required_keys):
                self.log_test("Admin Dashboard", True, f"Stats: {json.dumps(response, indent=2)}")
            else:
                self.log_test("Admin Dashboard", False, f"Missing keys in response: {response}")
        else:
            self.log_test("Admin Dashboard", False, f"Dashboard request failed: {response}")

    def test_business_registration(self):
        """Test business registration"""
        success, response = self.make_request(
            'POST', 
            '/auth/business/register', 
            self.test_business,
            expected_status=200
        )
        
        if success and 'session_token' in response:
            self.business_token = response['session_token']
            user = response.get('user', {})
            if user.get('role') == 'business' and user.get('email') == self.test_business['email']:
                self.log_test("Business Registration", True, f"Business ID: {user.get('user_id')}")
            else:
                self.log_test("Business Registration", False, f"Invalid user data: {user}")
        else:
            self.log_test("Business Registration", False, f"Registration failed: {response}")

    def test_business_login(self):
        """Test business login"""
        login_data = {
            "email": self.test_business['email'],
            "password": self.test_business['password']
        }
        
        success, response = self.make_request(
            'POST', 
            '/auth/business/login', 
            login_data
        )
        
        if success and 'session_token' in response:
            # Update token for future tests
            self.business_token = response['session_token']
            self.log_test("Business Login", True, f"Login successful")
        else:
            self.log_test("Business Login", False, f"Login failed: {response}")

    def test_driver_registration(self):
        """Test driver registration"""
        success, response = self.make_request(
            'POST', 
            '/auth/driver/register', 
            self.test_driver,
            expected_status=200
        )
        
        if success and 'session_token' in response:
            self.driver_token = response['session_token']
            user = response.get('user', {})
            if user.get('role') == 'driver' and user.get('phone') == self.test_driver['phone']:
                self.log_test("Driver Registration", True, f"Driver ID: {user.get('user_id')}")
            else:
                self.log_test("Driver Registration", False, f"Invalid user data: {user}")
        else:
            self.log_test("Driver Registration", False, f"Registration failed: {response}")

    def test_driver_login(self):
        """Test driver login"""
        login_data = {
            "phone": self.test_driver['phone'],
            "password": self.test_driver['password']
        }
        
        success, response = self.make_request(
            'POST', 
            '/auth/driver/login', 
            login_data
        )
        
        if success and 'session_token' in response:
            # Update token for future tests
            self.driver_token = response['session_token']
            self.log_test("Driver Login", True, f"Login successful")
        else:
            self.log_test("Driver Login", False, f"Login failed: {response}")

    def test_get_current_user(self):
        """Test get current user endpoint"""
        if not self.admin_token:
            self.log_test("Get Current User (Admin)", False, "No admin token available")
            return
        
        success, response = self.make_request('GET', '/auth/me', token=self.admin_token)
        
        if success and response.get('role') == 'admin':
            self.log_test("Get Current User (Admin)", True, f"User: {response.get('name')}")
        else:
            self.log_test("Get Current User (Admin)", False, f"Failed: {response}")

    def test_logout(self):
        """Test logout endpoint"""
        if not self.admin_token:
            self.log_test("Logout", False, "No token available")
            return
        
        success, response = self.make_request('POST', '/auth/logout', token=self.admin_token)
        
        if success and 'message' in response:
            self.log_test("Logout", True, f"Message: {response.get('message')}")
        else:
            self.log_test("Logout", False, f"Logout failed: {response}")

    def test_admin_drivers_list(self):
        """Test admin drivers list"""
        if not self.admin_token:
            self.log_test("Admin Drivers List", False, "No admin token available")
            return
        
        success, response = self.make_request('GET', '/admin/drivers', token=self.admin_token)
        
        if success and isinstance(response, list):
            self.log_test("Admin Drivers List", True, f"Found {len(response)} drivers")
        else:
            self.log_test("Admin Drivers List", False, f"Failed: {response}")

    def test_admin_businesses_list(self):
        """Test admin businesses list"""
        if not self.admin_token:
            self.log_test("Admin Businesses List", False, "No admin token available")
            return
        
        success, response = self.make_request('GET', '/admin/businesses', token=self.admin_token)
        
        if success and isinstance(response, list):
            self.log_test("Admin Businesses List", True, f"Found {len(response)} businesses")
        else:
            self.log_test("Admin Businesses List", False, f"Failed: {response}")

    def test_admin_pricing_rules(self):
        """Test admin pricing rules"""
        if not self.admin_token:
            self.log_test("Admin Pricing Rules", False, "No admin token available")
            return
        
        success, response = self.make_request('GET', '/admin/pricing', token=self.admin_token)
        
        if success and 'rules' in response and 'commission_percentage' in response:
            rules_count = len(response['rules'])
            commission = response['commission_percentage']
            self.log_test("Admin Pricing Rules", True, f"{rules_count} rules, {commission}% commission")
        else:
            self.log_test("Admin Pricing Rules", False, f"Failed: {response}")

    def test_item_types(self):
        """Test item types endpoint"""
        success, response = self.make_request('GET', '/item-types')
        
        if success and isinstance(response, list) and len(response) > 0:
            item_types = [item.get('id') for item in response]
            self.log_test("Item Types", True, f"Available types: {', '.join(item_types)}")
        else:
            self.log_test("Item Types", False, f"Failed: {response}")

    def test_time_slots(self):
        """Test time slots endpoint"""
        success, response = self.make_request('GET', '/time-slots')
        
        if success and isinstance(response, list) and len(response) > 0:
            time_slots = [slot.get('id') for slot in response]
            self.log_test("Time Slots", True, f"Available slots: {', '.join(time_slots)}")
        else:
            self.log_test("Time Slots", False, f"Failed: {response}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Fluxy Logistique API Tests")
        print("=" * 50)
        
        # Public endpoints
        self.test_api_health()
        self.test_item_types()
        self.test_time_slots()
        
        # Authentication tests
        self.test_admin_login()
        self.test_business_registration()
        self.test_business_login()
        self.test_driver_registration()
        self.test_driver_login()
        
        # Authenticated endpoints
        self.test_get_current_user()
        self.test_admin_dashboard()
        self.test_admin_drivers_list()
        self.test_admin_businesses_list()
        self.test_admin_pricing_rules()
        
        # Logout test (should be last)
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✅ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = FluxyAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 Test suite crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())