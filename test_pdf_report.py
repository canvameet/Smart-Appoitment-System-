"""
Test PDF Report Generation
Demonstrates the medical report PDF generation system
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_hospital_settings():
    """Test hospital settings API"""
    print("\n" + "="*60)
    print("TEST 1: Hospital Settings")
    print("="*60)
    
    # Get current settings
    response = requests.get(f"{BASE_URL}/hospital/settings")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    print(f"\nCurrent Settings:")
    if data.get('success'):
        settings = data['settings']
        print(f"  Hospital Name: {settings.get('hospitalName')}")
        print(f"  Address: {settings.get('address')}")
        print(f"  Contact: {settings.get('contactNumber')}")
        print(f"  Email: {settings.get('email')}")
    
    return data.get('success', False)


def test_pdf_generation():
    """Test PDF report generation"""
    print("\n" + "="*60)
    print("TEST 2: Generate PDF Report")
    print("="*60)
    
    # Sample report data
    report_data = {
        "patientName": "John Doe",
        "age": 35,
        "gender": "Male",
        "dateOfConsultation": "04-04-2026",
        "symptoms": [
            "Severe headache for 3 days",
            "Nausea and vomiting",
            "Sensitivity to light"
        ],
        "diagnosis": [
            "Migraine with aura",
            "Possible tension headache"
        ],
        "medicines": [
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "Twice daily after meals"
            },
            {
                "name": "Sumatriptan",
                "dosage": "50mg",
                "frequency": "As needed for migraine attacks"
            },
            {
                "name": "Ondansetron",
                "dosage": "4mg",
                "frequency": "Twice daily for nausea"
            }
        ],
        "recommendations": [
            "Rest in a dark, quiet room",
            "Stay hydrated - drink plenty of water",
            "Avoid bright lights and loud noises",
            "Maintain regular sleep schedule",
            "Avoid trigger foods (chocolate, cheese, caffeine)"
        ],
        "followUpInstructions": "Return after 1 week if symptoms persist or worsen. Seek immediate medical attention if experiencing severe symptoms like vision changes, confusion, or difficulty speaking.",
        "additionalNotes": "Patient has a history of migraines. Allergic to penicillin. Currently not on any other medications.",
        "doctorName": "Dr. Meet Ratwani"
    }
    
    # Generate PDF
    response = requests.post(
        f"{BASE_URL}/report/generate",
        json=report_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        # Save PDF
        filename = "test_medical_report.pdf"
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ PDF generated successfully!")
        print(f"📄 Saved as: {filename}")
        print(f"📊 File size: {len(response.content)} bytes")
        return True
    else:
        print(f"❌ Failed to generate PDF")
        print(f"Error: {response.text}")
        return False


def test_update_settings():
    """Test updating hospital settings"""
    print("\n" + "="*60)
    print("TEST 3: Update Hospital Settings")
    print("="*60)
    
    new_settings = {
        "hospitalName": "Smart Healthcare Medical Center",
        "address": "456 Medical Plaza, Healthcare District, City - 654321",
        "contactNumber": "+1-555-123-4567",
        "email": "contact@smarthealthcare.com",
        "website": "www.smarthealthcare.com",
        "footerText": "Powered by Smart Management System - Your Health, Our Priority"
    }
    
    response = requests.put(
        f"{BASE_URL}/hospital/settings",
        json=new_settings,
        headers={"Content-Type": "application/json"}
    )
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Success: {data.get('success')}")
    print(f"Message: {data.get('message')}")
    
    return data.get('success', False)


def run_all_tests():
    """Run all PDF report tests"""
    print("\n" + "="*80)
    print("PDF REPORT GENERATION SYSTEM - TESTS")
    print("="*80)
    
    results = []
    
    # Test 1: Get hospital settings
    results.append(("Hospital Settings", test_hospital_settings()))
    
    # Test 2: Generate PDF
    results.append(("PDF Generation", test_pdf_generation()))
    
    # Test 3: Update settings
    results.append(("Update Settings", test_update_settings()))
    
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
    
    if passed == total:
        print("\n🎉 All tests passed! PDF report system is working correctly.")
        print("\nNext steps:")
        print("1. Open Admin Dashboard → Hospital Settings tab")
        print("2. Configure your hospital details")
        print("3. Use the PDF generation API to create medical reports")
        print("4. Check the generated PDF: test_medical_report.pdf")


if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
