#!/usr/bin/env python3
"""
Backend API Testing for Sarkari Afsar Portal
Tests all backend API routes and server-side functionality
"""

import requests
import json
import time
import sys
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://govt-schemes-5.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_gemini_ai_summarize():
    """Test Gemini AI Summarize API - POST /api/ai/summarize"""
    print("\n=== Testing Gemini AI Summarize API ===")
    
    try:
        url = f"{API_BASE}/ai/summarize"
        payload = {
            "content": "BPSC DSO exam Jan 2026. Apply Sept 2025. Eligibility: Graduate degree required. Age limit 21-37 years. Total vacancies: 150 posts. Application fee: Rs 500 for general category. Selection process includes written exam and interview.",
            "title": "BPSC DSO 2026",
            "type": "job"
        }
        
        print(f"POST {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if "summary" in data and isinstance(data["summary"], str) and len(data["summary"]) > 10:
                print("✅ PASS: Gemini AI Summarize API working correctly")
                return True
            else:
                print("❌ FAIL: Invalid response structure or empty summary")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_gemini_ai_faq():
    """Test Gemini AI FAQ API - POST /api/ai/faq"""
    print("\n=== Testing Gemini AI FAQ API ===")
    
    try:
        url = f"{API_BASE}/ai/faq"
        payload = {
            "content": "IGNDPS scheme for disabled persons. Age 18-59, BPL family. Monthly pension Rs 300. Apply through district collector office. Required documents: disability certificate, income certificate, bank passbook.",
            "title": "IGNDPS Viklang Pension"
        }
        
        print(f"POST {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            if "faqs" in data and isinstance(data["faqs"], list) and len(data["faqs"]) > 0:
                # Check if each FAQ has question and answer
                valid_faqs = all("question" in faq and "answer" in faq for faq in data["faqs"])
                if valid_faqs:
                    print("✅ PASS: Gemini AI FAQ API working correctly")
                    return True
                else:
                    print("❌ FAIL: Invalid FAQ structure")
                    return False
            else:
                print("❌ FAIL: Invalid response structure or empty FAQs")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_home_page():
    """Test Home page - GET /"""
    print("\n=== Testing Home Page ===")
    
    try:
        url = BASE_URL
        print(f"GET {url}")
        
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            # Check for key elements that should be present
            if "Sarkari Afsar" in content and "html" in content.lower():
                print("✅ PASS: Home page loads successfully")
                return True
            else:
                print("❌ FAIL: Home page content invalid")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_job_detail_page():
    """Test Job detail page with server-side AI - GET /jobs/[slug]"""
    print("\n=== Testing Job Detail Page (Server-side AI) ===")
    
    try:
        # Use a common job slug that should exist
        url = f"{BASE_URL}/jobs/bpsc-dso-2026"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            # Check for AI Assistant section and key elements
            if ("AI Assistant" in content or "Quick Summary" in content) and "🤖" in content:
                print("✅ PASS: Job detail page with AI summary working")
                return True
            else:
                print("❌ FAIL: AI summary not found in job detail page")
                print("Content preview:", content[:500] + "..." if len(content) > 500 else content)
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_scheme_detail_page():
    """Test Scheme detail page with server-side AI - GET /yojana/[slug]"""
    print("\n=== Testing Scheme Detail Page (Server-side AI) ===")
    
    try:
        # Use a common scheme slug
        url = f"{BASE_URL}/yojana/indira-gandhi-national-disability-pension-scheme-igndps-viklang-pension"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            # Check for AI Assistant section and key elements
            if ("AI Assistant" in content or "Quick Summary" in content) and "🤖" in content:
                print("✅ PASS: Scheme detail page with AI summary working")
                return True
            else:
                print("❌ FAIL: AI summary not found in scheme detail page")
                print("Content preview:", content[:500] + "..." if len(content) > 500 else content)
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_jobs_listing():
    """Test Jobs listing page - GET /jobs"""
    print("\n=== Testing Jobs Listing Page ===")
    
    try:
        url = f"{BASE_URL}/jobs"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            if "jobs" in content.lower() and "html" in content.lower():
                print("✅ PASS: Jobs listing page loads successfully")
                return True
            else:
                print("❌ FAIL: Jobs listing page content invalid")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_yojana_listing():
    """Test Yojana listing page - GET /yojana"""
    print("\n=== Testing Yojana Listing Page ===")
    
    try:
        url = f"{BASE_URL}/yojana"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            if ("yojana" in content.lower() or "scheme" in content.lower()) and "html" in content.lower():
                print("✅ PASS: Yojana listing page loads successfully")
                return True
            else:
                print("❌ FAIL: Yojana listing page content invalid")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_search_page():
    """Test Search page - GET /search"""
    print("\n=== Testing Search Page ===")
    
    try:
        url = f"{BASE_URL}/search"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text
            if "search" in content.lower() and "html" in content.lower():
                print("✅ PASS: Search page loads successfully")
                return True
            else:
                print("❌ FAIL: Search page content invalid")
                return False
        else:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: Exception occurred - {str(e)}")
        return False

def test_static_pages():
    """Test Static pages - GET /about, /contact, /privacy-policy, /disclaimer"""
    print("\n=== Testing Static Pages ===")
    
    pages = [
        ("/about", "About"),
        ("/contact", "Contact"),
        ("/privacy-policy", "Privacy"),
        ("/disclaimer", "Disclaimer")
    ]
    
    results = []
    
    for path, name in pages:
        try:
            url = f"{BASE_URL}{path}"
            print(f"\nTesting {name} page: GET {url}")
            
            response = requests.get(url, timeout=15)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                content = response.text
                if "html" in content.lower():
                    print(f"✅ PASS: {name} page loads successfully")
                    results.append(True)
                else:
                    print(f"❌ FAIL: {name} page content invalid")
                    results.append(False)
            else:
                print(f"❌ FAIL: {name} page HTTP {response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"❌ FAIL: {name} page exception - {str(e)}")
            results.append(False)
    
    return all(results)

def main():
    """Run all backend tests"""
    print("🚀 Starting Sarkari Afsar Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("=" * 60)
    
    # Test results
    results = {}
    
    # Run all tests
    test_functions = [
        ("Gemini AI Summarize API", test_gemini_ai_summarize),
        ("Gemini AI FAQ API", test_gemini_ai_faq),
        ("Home Page", test_home_page),
        ("Job Detail Page (Server-side AI)", test_job_detail_page),
        ("Scheme Detail Page (Server-side AI)", test_scheme_detail_page),
        ("Jobs Listing", test_jobs_listing),
        ("Yojana Listing", test_yojana_listing),
        ("Search Page", test_search_page),
        ("Static Pages", test_static_pages)
    ]
    
    for test_name, test_func in test_functions:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ FAIL: {test_name} - Unexpected error: {str(e)}")
            results[test_name] = False
        
        # Small delay between tests
        time.sleep(1)
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return 0
    else:
        print(f"⚠️  {total - passed} backend tests FAILED!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)