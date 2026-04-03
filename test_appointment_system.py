"""
Test Appointment System Integration
Verifies Firebase appointments, doctor dashboard, and emergency alerts
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_doctor_list():
    """Test fetching doctors from Firestore"""
    print("\n" + "="*60)
    print("TEST 1: Fetch Doctors from Firestore")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/doctors/list")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    print(f"Total Doctors: {data.get('total', 0)}")
    
    if data.get('doctors'):
        print("\nDoctors:")
        for doc in data['doctors']:
            print(f"  - {doc['name']} (ID: {doc['id']})")
    
    return data.get('success', False)


def test_check_appointment_limit():
    """Test daily appointment limit check"""
    print("\n" + "="*60)
    print("TEST 2: Check Daily Appointment Limit")
    print("="*60)
    
    test_data = {
        "userId": "test_user_123",
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    
    response = requests.post(
        f"{BASE_URL}/appointments/check-limit",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    print(f"Can Book: {data.get('canBook')}")
    print(f"Current Count: {data.get('count')}")
    print(f"Message: {data.get('message')}")
    
    return data.get('success', False)


def test_create_appointment():
    """Test creating a new appointment"""
    print("\n" + "="*60)
    print("TEST 3: Create New Appointment")
    print("="*60)
    
    test_appointment = {
        "userId": "test_user_456",
        "doctorId": "test_doctor_123",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timeSlot": "10:00 AM - 10:15 AM",
        "isEmergency": False,
        "patientName": "Test Patient",
        "patientAge": 35,
        "patientPhone": "+919876543210",
        "symptoms": "Fever and headache for 2 days",
        "triage": {
            "severity": 2,
            "is_emergency": False,
            "triage_reason": "Mild symptoms, routine consultation recommended",
            "confidence": 0.85
        },
        "predictedTime": 25
    }
    
    response = requests.post(
        f"{BASE_URL}/appointments/create",
        json=test_appointment,
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    
    if data.get('success'):
        print(f"Appointment ID: {data.get('appointmentId')}")
        print(f"Message: {data.get('message')}")
        return data.get('appointmentId')
    else:
        print(f"Error: {data.get('error', 'Unknown error')}")
        return None


def test_get_doctor_appointments(doctor_id):
    """Test fetching doctor's appointments"""
    print("\n" + "="*60)
    print("TEST 4: Fetch Doctor Appointments")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/appointments/doctor/{doctor_id}")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    print(f"Total Appointments: {data.get('total', 0)}")
    
    if data.get('appointments'):
        print("\nAppointments:")
        for appt in data['appointments'][:5]:  # Show first 5
            print(f"  - {appt.get('patientName')} | {appt.get('date')} {appt.get('timeSlot')}")
            print(f"    Status: {appt.get('status')} | Emergency: {appt.get('isEmergency')}")
    
    return data.get('success', False)


def test_update_appointment_status(appointment_id):
    """Test updating appointment status"""
    print("\n" + "="*60)
    print("TEST 5: Update Appointment Status")
    print("="*60)
    
    if not appointment_id:
        print("⚠️  No appointment ID provided, skipping test")
        return False
    
    # Test status progression: pending -> confirmed -> completed
    statuses = ['confirmed', 'completed']
    
    for status in statuses:
        response = requests.put(
            f"{BASE_URL}/appointments/{appointment_id}/status",
            json={"status": status},
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        
        print(f"\nUpdating to '{status}':")
        print(f"  Status: {response.status_code}")
        print(f"  Success: {data.get('success')}")
        print(f"  Message: {data.get('message')}")
    
    return True


def test_emergency_appointment():
    """Test creating emergency appointment (should alert all doctors)"""
    print("\n" + "="*60)
    print("TEST 6: Create Emergency Appointment")
    print("="*60)
    
    emergency_appointment = {
        "userId": "emergency_user_789",
        "doctorId": "test_doctor_123",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timeSlot": "11:00 AM - 11:15 AM",
        "isEmergency": True,
        "patientName": "Emergency Patient",
        "patientAge": 45,
        "patientPhone": "+919876543210",
        "symptoms": "Severe chest pain and difficulty breathing",
        "triage": {
            "severity": 5,
            "is_emergency": True,
            "triage_reason": "Critical symptoms detected - immediate medical attention required",
            "confidence": 0.95
        },
        "predictedTime": 45
    }
    
    response = requests.post(
        f"{BASE_URL}/appointments/create",
        json=emergency_appointment,
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    
    if data.get('success'):
        print(f"🚨 Emergency Appointment ID: {data.get('appointmentId')}")
        print(f"Message: {data.get('message')}")
        print("Note: This appointment should be visible to ALL doctors")
        return data.get('appointmentId')
    else:
        print(f"Error: {data.get('error', 'Unknown error')}")
        return None


def run_all_tests():
    """Run all appointment system tests"""
    print("\n" + "="*80)
    print("APPOINTMENT SYSTEM INTEGRATION TESTS")
    print("="*80)
    
    results = []
    
    # Test 1: Doctor List
    results.append(("Doctor List", test_doctor_list()))
    
    # Test 2: Check Limit
    results.append(("Check Limit", test_check_appointment_limit()))
    
    # Test 3: Create Appointment
    appointment_id = test_create_appointment()
    results.append(("Create Appointment", appointment_id is not None))
    
    # Test 4: Get Doctor Appointments
    results.append(("Get Doctor Appointments", test_get_doctor_appointments("test_doctor_123")))
    
    # Test 5: Update Status
    if appointment_id:
        results.append(("Update Status", test_update_appointment_status(appointment_id)))
    
    # Test 6: Emergency Appointment
    emergency_id = test_emergency_appointment()
    results.append(("Emergency Appointment", emergency_id is not None))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*80)


if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
