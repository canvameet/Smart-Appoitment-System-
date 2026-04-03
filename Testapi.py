"""
Test Script for Healthcare Appointment Scheduling ML API
Tests all endpoints with various scenarios
"""

import requests
import json
import time

# API base URL
BASE_URL = "http://localhost:5000"


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def test_health_check():
    """Test health check endpoint"""
    print_section("TEST 1: Health Check")
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    print("✅ Health check passed")


def test_prediction():
    """Test prediction endpoint with various scenarios"""
    print_section("TEST 2: Prediction API")
    
    test_cases = [
        {
            "name": "Emergency High Severity Patient",
            "data": {
                "age": 65,
                "visit_type": 1,
                "severity": 5,
                "is_emergency": 1,
                "past_avg_time": 45.0,
                "doctor_experience": 15
            }
        },
        {
            "name": "First Visit Moderate Severity",
            "data": {
                "age": 35,
                "visit_type": 0,
                "severity": 3,
                "is_emergency": 0,
                "past_avg_time": 0.0,
                "doctor_experience": 8
            }
        },
        {
            "name": "Follow-up Low Severity",
            "data": {
                "age": 42,
                "visit_type": 1,
                "severity": 2,
                "is_emergency": 0,
                "past_avg_time": 25.0,
                "doctor_experience": 20
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        print(f"Input: {json.dumps(test_case['data'], indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/predict",
            json=test_case['data'],
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        assert response.status_code == 200
        assert result['success'] == True
        print(f"✅ Predicted time: {result['predicted_time']} minutes")


def test_patient_history():
    """Test patient history endpoint"""
    print_section("TEST 3: Patient History API")
    
    patient_ids = ["P0001", "P0042", "P9999"]
    
    for patient_id in patient_ids:
        print(f"\n--- Fetching history for {patient_id} ---")
        
        response = requests.get(f"{BASE_URL}/history/{patient_id}")
        print(f"Status Code: {response.status_code}")
        
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        assert response.status_code == 200
        print(f"✅ History retrieved for {patient_id}")


def test_add_record():
    """Test adding patient consultation records"""
    print_section("TEST 4: Add Patient Record API")
    
    records = [
        {"patient_id": "P0001", "consultation_time": 35.5},
        {"patient_id": "P1000", "consultation_time": 42.0}
    ]
    
    for record in records:
        print(f"\n--- Adding record for {record['patient_id']} ---")
        print(f"Input: {json.dumps(record, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/add-record",
            json=record,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        assert response.status_code == 200
        print(f"✅ Record added for {record['patient_id']}")


def test_batch_prediction():
    """Test batch prediction endpoint"""
    print_section("TEST 5: Batch Prediction API")
    
    batch_data = {
        "patients": [
            {
                "age": 55,
                "visit_type": 1,
                "severity": 3,
                "is_emergency": 0,
                "past_avg_time": 35.0,
                "doctor_experience": 12
            },
            {
                "age": 70,
                "visit_type": 0,
                "severity": 4,
                "is_emergency": 1,
                "past_avg_time": 0.0,
                "doctor_experience": 8
            },
            {
                "age": 30,
                "visit_type": 1,
                "severity": 1,
                "is_emergency": 0,
                "past_avg_time": 20.0,
                "doctor_experience": 25
            }
        ]
    }
    
    print(f"Sending batch of {len(batch_data['patients'])} patients...")
    
    response = requests.post(
        f"{BASE_URL}/batch-predict",
        json=batch_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    assert response.status_code == 200
    assert len(result['predictions']) == len(batch_data['patients'])
    print(f"✅ Batch prediction completed for {result['total_patients']} patients")


def test_error_handling():
    """Test API error handling"""
    print_section("TEST 6: Error Handling")
    
    # Test missing fields
    print("\n--- Test: Missing required fields ---")
    incomplete_data = {
        "age": 45,
        "severity": 3
        # Missing other required fields
    }
    
    response = requests.post(
        f"{BASE_URL}/predict",
        json=incomplete_data,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 400
    print("✅ Error handling works correctly")


def run_all_tests():
    """Run all API tests"""
    print("\n" + "=" * 80)
    print("🧪 HEALTHCARE APPOINTMENT SCHEDULING ML API - TEST SUITE")
    print("=" * 80)
    print("\n⚠️  Make sure the Flask API is running at http://localhost:5000")
    print("   Run: python flask_app.py")
    print("\n" + "=" * 80)
    
    input("\nPress Enter to start tests...")
    
    try:
        test_health_check()
        test_prediction()
        test_patient_history()
        test_add_record()
        test_batch_prediction()
        test_error_handling()
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to API server")
        print("Please make sure Flask app is running: python flask_app.py")
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_tests()