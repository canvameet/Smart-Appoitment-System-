"""
Test Doctor Dashboard - Verify appointments are visible
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_full_flow():
    """Test complete flow: Get doctors -> Create appointment -> Fetch doctor appointments"""
    print("\n" + "="*80)
    print("DOCTOR DASHBOARD TEST - Full Flow")
    print("="*80)
    
    # Step 1: Get list of doctors
    print("\n1️⃣ Fetching doctors from Firestore...")
    doctors_resp = requests.get(f"{BASE_URL}/doctors/list")
    doctors_data = doctors_resp.json()
    
    if not doctors_data.get('success') or not doctors_data.get('doctors'):
        print("❌ No doctors found in database")
        return False
    
    doctor = doctors_data['doctors'][0]
    doctor_id = doctor['id']
    doctor_name = doctor['name']
    
    print(f"✅ Found doctor: {doctor_name} (ID: {doctor_id})")
    
    # Step 2: Create a test appointment for this doctor
    print(f"\n2️⃣ Creating test appointment for {doctor_name}...")
    
    test_appointment = {
        "userId": "test_patient_dashboard_001",
        "doctorId": doctor_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timeSlot": "02:00 PM - 02:15 PM",
        "isEmergency": False,
        "patientName": "Dashboard Test Patient",
        "patientAge": 28,
        "patientPhone": "+919876543210",
        "symptoms": "Regular checkup - testing dashboard",
        "triage": {
            "severity": 1,
            "is_emergency": False,
            "triage_reason": "Routine checkup",
            "confidence": 0.90
        },
        "predictedTime": 20,
        "status": "pending"
    }
    
    create_resp = requests.post(
        f"{BASE_URL}/appointments/create",
        json=test_appointment,
        headers={"Content-Type": "application/json"}
    )
    create_data = create_resp.json()
    
    if not create_data.get('success'):
        print(f"❌ Failed to create appointment: {create_data.get('error')}")
        return False
    
    appointment_id = create_data['appointmentId']
    print(f"✅ Appointment created: {appointment_id}")
    
    # Step 3: Fetch appointments for this doctor
    print(f"\n3️⃣ Fetching appointments for doctor {doctor_id}...")
    
    fetch_resp = requests.get(f"{BASE_URL}/appointments/doctor/{doctor_id}")
    fetch_data = fetch_resp.json()
    
    if not fetch_data.get('success'):
        print(f"❌ Failed to fetch appointments: {fetch_data.get('error')}")
        return False
    
    appointments = fetch_data.get('appointments', [])
    print(f"✅ Retrieved {len(appointments)} appointment(s)")
    
    # Step 4: Verify our test appointment is in the list
    print(f"\n4️⃣ Verifying test appointment is visible...")
    
    found = False
    for appt in appointments:
        if appt.get('id') == appointment_id:
            found = True
            print(f"✅ Test appointment found!")
            print(f"   Patient: {appt.get('patientName')}")
            print(f"   Date: {appt.get('date')}")
            print(f"   Time: {appt.get('timeSlot')}")
            print(f"   Status: {appt.get('status')}")
            break
    
    if not found:
        print(f"❌ Test appointment NOT found in doctor's appointments")
        print(f"   Expected ID: {appointment_id}")
        print(f"   Found {len(appointments)} appointments:")
        for appt in appointments[:5]:
            print(f"   - {appt.get('id')}: {appt.get('patientName')}")
        return False
    
    # Step 5: Show all pending appointments
    print(f"\n5️⃣ All pending appointments for {doctor_name}:")
    pending = [a for a in appointments if a.get('status') == 'pending']
    
    if pending:
        for i, appt in enumerate(pending, 1):
            emergency_flag = "🚨" if appt.get('isEmergency') else "  "
            print(f"   {i}. {emergency_flag} {appt.get('patientName')} - {appt.get('date')} {appt.get('timeSlot')}")
    else:
        print("   No pending appointments")
    
    print("\n" + "="*80)
    print("✅ DOCTOR DASHBOARD TEST PASSED")
    print("="*80)
    print("\nNEXT STEPS:")
    print("1. Open browser and disable ad blocker")
    print("2. Login as doctor with email:", doctor.get('email', 'N/A'))
    print("3. Navigate to Doctor Dashboard")
    print("4. You should see the test appointment above")
    print("="*80)
    
    return True


if __name__ == "__main__":
    try:
        success = test_full_flow()
        if not success:
            print("\n❌ Test failed - check errors above")
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
