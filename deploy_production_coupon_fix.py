#!/usr/bin/env python3
"""
Production Coupon Fix Deployment Script

This script will:
1. Deploy the enhanced coupon validation to your Digital Ocean server
2. Run the database sync to fix any existing userUsages data
3. Verify the fix is working in production

Run this after you've uploaded your code to Digital Ocean.
"""

import requests
import json
import asyncio
import sys
import os
from datetime import datetime

class ProductionCouponFixer:
    def __init__(self, production_url):
        self.production_url = production_url.rstrip('/')
        self.api_base = f"{self.production_url}/api"
        
    def test_coupon_endpoint(self, coupon_code, user_email):
        """Test coupon validation endpoint in production."""
        print(f"🧪 Testing coupon '{coupon_code}' for user '{user_email}'")
        
        try:
            # Test the validate coupon endpoint
            validate_url = f"{self.api_base}/coupons/validate"
            payload = {
                "code": coupon_code,
                "userEmail": user_email
            }
            
            response = requests.post(validate_url, json=payload, timeout=10)
            
            print(f"   📡 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Response: {json.dumps(data, indent=6)}")
                return data
            else:
                print(f"   ❌ Error Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"   💥 Exception: {str(e)}")
            return None
    
    def run_production_fix_script(self):
        """Trigger the production fix script via API."""
        print("🔧 Running production database fix script...")
        
        try:
            # This would be an endpoint you create to run the fix script
            fix_url = f"{self.api_base}/admin/fix-coupon-usage"
            
            response = requests.post(fix_url, timeout=30)
            
            if response.status_code == 200:
                print("   ✅ Fix script completed successfully")
                return True
            else:
                print(f"   ❌ Fix script failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"   💥 Fix script error: {str(e)}")
            return False
    
    def comprehensive_production_test(self):
        """Run comprehensive tests against production."""
        print("🚀 Starting Comprehensive Production Coupon Test")
        print("=" * 60)
        
        # Test scenarios based on your issue
        test_scenarios = [
            {
                "name": "First usage attempt (should work)",
                "email": "newuser@example.com",
                "coupon": "test7",
                "expected": "valid"
            },
            {
                "name": "Second usage attempt by same user (should fail)",
                "email": "newuser@example.com", 
                "coupon": "test7",
                "expected": "invalid"
            },
            {
                "name": "Known used coupon (should fail)",
                "email": "mrbrownaffiliate@gmail.com",
                "coupon": "test7", 
                "expected": "invalid"
            },
            {
                "name": "Case sensitivity test (should fail)",
                "email": "MRBROWNAFFILIATE@GMAIL.COM",
                "coupon": "test7",
                "expected": "invalid"
            }
        ]
        
        print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Production URL: {self.production_url}")
        
        results = []
        
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"\n📋 Test {i}: {scenario['name']}")
            
            result = self.test_coupon_endpoint(scenario['coupon'], scenario['email'])
            
            if result:
                # Analyze the response
                is_valid = result.get('valid', False)
                message = result.get('message', '')
                
                # Check if result matches expectation
                expected_valid = scenario['expected'] == 'valid'
                matches_expectation = is_valid == expected_valid
                
                status_icon = "✅" if matches_expectation else "❌"
                print(f"   🎯 Expected: {scenario['expected']}, Got: {'valid' if is_valid else 'invalid'} {status_icon}")
                
                if not matches_expectation:
                    print(f"   ⚠️  PRODUCTION BUG DETECTED!")
                
                results.append({
                    'test': scenario['name'],
                    'expected': scenario['expected'],
                    'actual': 'valid' if is_valid else 'invalid',
                    'matches': matches_expectation,
                    'message': message
                })
            else:
                print(f"   💥 Test failed - no response")
                results.append({
                    'test': scenario['name'],
                    'expected': scenario['expected'],
                    'actual': 'error',
                    'matches': False,
                    'message': 'No response'
                })
        
        # Summary
        print(f"\n📊 Test Summary")
        print("=" * 30)
        
        passed = sum(1 for r in results if r['matches'])
        total = len(results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if passed == total:
            print(f"\n🎉 ALL TESTS PASSED! Production fix successful!")
        else:
            print(f"\n⚠️  Some tests failed. Production still has issues.")
            print(f"\nFailed tests:")
            for r in results:
                if not r['matches']:
                    print(f"   - {r['test']}: expected {r['expected']}, got {r['actual']}")
        
        return passed == total

def main():
    print("🚀 MonkeyZ Production Coupon Fix Deployment")
    print("=" * 50)
    
    # You'll need to replace this with your actual production URL
    production_url = input("Enter your production URL (e.g., https://yoursite.com): ").strip()
    
    if not production_url:
        print("❌ No production URL provided. Exiting.")
        return
    
    fixer = ProductionCouponFixer(production_url)
    
    print(f"\n🎯 Production URL: {production_url}")
    
    # Step 1: Test current state
    print(f"\n1️⃣ Testing current production state...")
    current_working = fixer.comprehensive_production_test()
    
    if current_working:
        print(f"\n✅ Production is already working correctly!")
        return
    
    # Step 2: Offer to run fix script
    print(f"\n2️⃣ Production needs fixing...")
    
    run_fix = input("Run the database fix script? (y/n): ").strip().lower()
    
    if run_fix == 'y':
        success = fixer.run_production_fix_script()
        
        if success:
            print(f"\n3️⃣ Re-testing after fix...")
            final_working = fixer.comprehensive_production_test()
            
            if final_working:
                print(f"\n🎉 SUCCESS! Production is now fixed!")
            else:
                print(f"\n⚠️  Fix script ran but issues still exist.")
        else:
            print(f"\n❌ Fix script failed to run.")
    else:
        print(f"\n⚠️  Skipping fix script. You'll need to deploy the enhanced code manually.")
    
    print(f"\n📋 Next Steps:")
    print(f"   1. Make sure you've uploaded the enhanced coupon_service.py to production")
    print(f"   2. Restart your FastAPI backend server")
    print(f"   3. Run this script again to verify the fix")

if __name__ == "__main__":
    main()
