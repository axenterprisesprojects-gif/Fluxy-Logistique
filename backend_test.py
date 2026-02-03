#!/usr/bin/env python3
"""
QuickHaul Backend API Test Suite
Tests the complete delivery flow as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://fluxy-express.preview.emergentagent.com/api"

class QuickHaulTester:
    def __init__(self):
        self.session = requests.Session()
        self.business_token = None
        self.driver_token = None
        self.admin_token = None
        self.delivery_id = None
        self.delivery_code = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_business_login(self):
        """Test business login with provided credentials"""
        self.log("Testing business login...")
        
        url = f"{BACKEND_URL}/auth/business/login"
        data = {
            "email": "newtest@business.com",
            "password": "test123456"
        }
        
        try:
            response = self.session.post(url, json=data)
            self.log(f"Business login response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.business_token = result.get("session_token")
                self.log("✅ Business login successful")
                self.log(f"Business user: {result.get('user', {}).get('name', 'Unknown')}")
                return True
            else:
                self.log(f"❌ Business login failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Business login error: {str(e)}", "ERROR")
            return False
    
    def test_delivery_creation(self):
        """Test delivery creation with specified data"""
        self.log("Testing delivery creation...")
        
        if not self.business_token:
            self.log("❌ No business token available", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/business/delivery"
        headers = {"Authorization": f"Bearer {self.business_token}"}
        data = {
            "customer_name": "Jean Dupont",
            "customer_phone": "+241 07 12 34 56",
            "item_description": "3 fauteuils, 1 armoire",
            "destination_area": "Akanda, Libreville",
            "destination_lat": -0.7269,
            "destination_lng": 9.3673
        }
        
        try:
            response = self.session.post(url, json=data, headers=headers)
            self.log(f"Delivery creation response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.delivery_id = result.get("delivery_id")
                self.delivery_code = result.get("delivery_code")
                
                self.log("✅ Delivery creation successful")
                self.log(f"Delivery ID: {self.delivery_id}")
                self.log(f"Delivery Code: {self.delivery_code}")
                self.log(f"Customer: {result.get('customer_name')}")
                self.log(f"Items: {result.get('item_description')}")
                self.log(f"Destination: {result.get('destination_area')}")
                self.log(f"Total Price: {result.get('total_price')} F")
                return True
            else:
                self.log(f"❌ Delivery creation failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Delivery creation error: {str(e)}", "ERROR")
            return False
    
    def test_driver_login(self):
        """Test driver login with provided credentials"""
        self.log("Testing driver login...")
        
        url = f"{BACKEND_URL}/auth/driver/login"
        data = {
            "phone": "+241 07 00 00 01",
            "name": "Test Chauffeur"
        }
        
        try:
            response = self.session.post(url, json=data)
            self.log(f"Driver login response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.driver_token = result.get("session_token")
                self.log("✅ Driver login successful")
                self.log(f"Driver: {result.get('user', {}).get('name', 'Unknown')}")
                return True
            else:
                self.log(f"❌ Driver login failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Driver login error: {str(e)}", "ERROR")
            return False
    
    def test_available_jobs(self):
        """Test getting available jobs for driver"""
        self.log("Testing available jobs retrieval...")
        
        if not self.driver_token:
            self.log("❌ No driver token available", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/driver/available-jobs"
        headers = {"Authorization": f"Bearer {self.driver_token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            self.log(f"Available jobs response: {response.status_code}")
            
            if response.status_code == 200:
                jobs = response.json()
                self.log(f"✅ Found {len(jobs)} available jobs")
                
                # Check if our delivery is in the list
                delivery_found = False
                for job in jobs:
                    if job.get("delivery_id") == self.delivery_id:
                        delivery_found = True
                        self.log(f"✅ Our delivery found in available jobs")
                        self.log(f"   Customer: {job.get('customer_name')}")
                        self.log(f"   Items: {job.get('item_description')}")
                        self.log(f"   Destination: {job.get('destination_area')}")
                        self.log(f"   Code: {job.get('delivery_code')}")
                        break
                
                if not delivery_found and self.delivery_id:
                    self.log("❌ Our delivery not found in available jobs", "ERROR")
                    return False
                    
                return True
            else:
                self.log(f"❌ Available jobs failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Available jobs error: {str(e)}", "ERROR")
            return False
    
    def test_job_acceptance(self):
        """Test driver accepting the delivery job"""
        self.log("Testing job acceptance...")
        
        if not self.driver_token or not self.delivery_id:
            self.log("❌ Missing driver token or delivery ID", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/driver/accept/{self.delivery_id}"
        headers = {"Authorization": f"Bearer {self.driver_token}"}
        
        try:
            response = self.session.post(url, headers=headers)
            self.log(f"Job acceptance response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Job acceptance successful")
                self.log(f"Status: {result.get('status')}")
                self.log(f"Driver: {result.get('driver_name')}")
                self.log(f"Accepted at: {result.get('accepted_at')}")
                return True
            else:
                self.log(f"❌ Job acceptance failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Job acceptance error: {str(e)}", "ERROR")
            return False
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        self.log("Testing admin login...")
        
        url = f"{BACKEND_URL}/auth/admin/login"
        data = {
            "email": "admin@quickhaul.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(url, json=data)
            self.log(f"Admin login response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.admin_token = result.get("session_token")
                self.log("✅ Admin login successful")
                self.log(f"Admin user: {result.get('user', {}).get('name', 'Unknown')}")
                self.log(f"Admin role: {result.get('user', {}).get('role', 'Unknown')}")
                self.log(f"Admin token: {self.admin_token[:20]}..." if self.admin_token else "No token")
                return True
            else:
                self.log(f"❌ Admin login failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login error: {str(e)}", "ERROR")
            return False
    
    def test_admin_dashboard(self):
        """Test admin dashboard stats"""
        self.log("Testing admin dashboard...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/admin/dashboard"
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            self.log(f"Admin dashboard response: {response.status_code}")
            
            if response.status_code == 200:
                stats = response.json()
                self.log("✅ Admin dashboard successful")
                self.log(f"Total deliveries: {stats.get('deliveries', {}).get('total', 0)}")
                self.log(f"Pending deliveries: {stats.get('deliveries', {}).get('pending', 0)}")
                self.log(f"Active deliveries: {stats.get('deliveries', {}).get('active', 0)}")
                self.log(f"Total drivers: {stats.get('drivers', {}).get('total', 0)}")
                self.log(f"Total businesses: {stats.get('businesses', {}).get('total', 0)}")
                return True
            else:
                self.log(f"❌ Admin dashboard failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin dashboard error: {str(e)}", "ERROR")
            return False
    
    def test_admin_deliveries(self):
        """Test admin viewing all deliveries"""
        self.log("Testing admin deliveries view...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/admin/deliveries"
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            self.log(f"Admin deliveries response: {response.status_code}")
            
            if response.status_code == 200:
                deliveries = response.json()
                self.log(f"✅ Found {len(deliveries)} total deliveries")
                
                # Check if our delivery is in the list
                delivery_found = False
                for delivery in deliveries:
                    if delivery.get("delivery_id") == self.delivery_id:
                        delivery_found = True
                        self.log(f"✅ Our delivery found in admin view")
                        self.log(f"   Status: {delivery.get('status')}")
                        self.log(f"   Driver: {delivery.get('driver_name', 'None')}")
                        break
                
                if not delivery_found and self.delivery_id:
                    self.log("❌ Our delivery not found in admin view", "ERROR")
                    return False
                    
                return True
            else:
                self.log(f"❌ Admin deliveries failed: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin deliveries error: {str(e)}", "ERROR")
            return False
    
    def run_complete_flow_test(self):
        """Run the complete delivery flow test"""
        self.log("=" * 60)
        self.log("STARTING QUICKHAUL COMPLETE DELIVERY FLOW TEST")
        self.log("=" * 60)
        
        tests = [
            ("Business Login", self.test_business_login),
            ("Delivery Creation", self.test_delivery_creation),
            ("Driver Login", self.test_driver_login),
            ("Available Jobs", self.test_available_jobs),
            ("Job Acceptance", self.test_job_acceptance),
            ("Admin Login", self.test_admin_login),
            ("Admin Dashboard", self.test_admin_dashboard),
            ("Admin Deliveries", self.test_admin_deliveries),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                if test_func():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                self.log(f"❌ {test_name} crashed: {str(e)}", "ERROR")
                failed += 1
        
        self.log("\n" + "=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        self.log(f"✅ Passed: {passed}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"Total: {passed + failed}")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED - Complete delivery flow working!")
            return True
        else:
            self.log("💥 SOME TESTS FAILED - Issues found in delivery flow")
            return False

if __name__ == "__main__":
    tester = QuickHaulTester()
    success = tester.run_complete_flow_test()
    sys.exit(0 if success else 1)