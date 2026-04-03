"""
Firebase Appointments Management
Handles appointment CRUD operations with Firestore
"""
import os
import json
from datetime import datetime
from google.cloud import firestore
from google.oauth2 import service_account

# Initialize Firestore
def initialize_firestore():
    """Initialize Firestore client"""
    try:
        # Load service account from environment or file
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'loginapp-e7f18-firebase-adminsdk-fbsvc-766ae828f0.json')
        
        if os.path.exists(service_account_path):
            credentials = service_account.Credentials.from_service_account_file(service_account_path)
            db = firestore.Client(credentials=credentials, project='loginapp-e7f18')
            print("✅ Firestore initialized successfully")
            return db
        else:
            print("⚠️  Firebase service account file not found")
            return None
    except Exception as e:
        print(f"❌ Failed to initialize Firestore: {e}")
        return None

db = initialize_firestore()


def check_daily_appointment_limit(user_id, date):
    """
    Check if user has reached daily appointment limit (2 per day)
    
    Args:
        user_id (str): User's Firebase UID
        date (str): Date in YYYY-MM-DD format
    
    Returns:
        dict: {can_book: bool, count: int, message: str}
    """
    if not db:
        return {'can_book': True, 'count': 0, 'message': 'Database not available'}
    
    try:
        # Query appointments for this user on this date
        appointments_ref = db.collection('appointments')
        query = appointments_ref.where('userId', '==', user_id).where('date', '==', date)
        appointments = query.stream()
        
        count = sum(1 for _ in appointments)
        
        if count >= 2:
            return {
                'can_book': False,
                'count': count,
                'message': 'Daily limit reached. You can only book 2 appointments per day.'
            }
        
        return {
            'can_book': True,
            'count': count,
            'message': f'You can book {2 - count} more appointment(s) today.'
        }
        
    except Exception as e:
        print(f"❌ Error checking appointment limit: {e}")
        return {'can_book': True, 'count': 0, 'message': 'Error checking limit'}


def create_appointment(appointment_data):
    """
    Create new appointment in Firestore
    
    Args:
        appointment_data (dict): Appointment details
            - userId (required)
            - doctorId (required)
            - date (required)
            - timeSlot (required)
            - isEmergency (required)
            - patientName
            - patientAge
            - symptoms
            - status (default: pending)
    
    Returns:
        dict: {success: bool, appointmentId: str, message: str}
    """
    if not db:
        return {'success': False, 'message': 'Database not available'}
    
    try:
        # Validate required fields
        required_fields = ['userId', 'doctorId', 'date', 'timeSlot']
        for field in required_fields:
            if field not in appointment_data:
                return {'success': False, 'message': f'Missing required field: {field}'}
        
        # Check daily limit
        limit_check = check_daily_appointment_limit(
            appointment_data['userId'],
            appointment_data['date']
        )
        
        if not limit_check['can_book']:
            return {
                'success': False,
                'message': limit_check['message'],
                'limit_reached': True
            }
        
        # Prepare appointment document
        appointment = {
            'userId': appointment_data['userId'],
            'doctorId': appointment_data['doctorId'],
            'date': appointment_data['date'],
            'timeSlot': appointment_data['timeSlot'],
            'isEmergency': appointment_data.get('isEmergency', False),
            'patientName': appointment_data.get('patientName', ''),
            'patientAge': appointment_data.get('patientAge', 0),
            'patientPhone': appointment_data.get('patientPhone', ''),
            'symptoms': appointment_data.get('symptoms', ''),
            'triage': appointment_data.get('triage', {}),
            'predictedTime': appointment_data.get('predictedTime', 20),
            'status': appointment_data.get('status', 'pending'),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        # Add to Firestore
        doc_ref = db.collection('appointments').add(appointment)
        appointment_id = doc_ref[1].id
        
        # Prepare response (replace SERVER_TIMESTAMP with actual datetime for JSON serialization)
        response_appointment = appointment.copy()
        response_appointment['createdAt'] = datetime.now().isoformat()
        response_appointment['updatedAt'] = datetime.now().isoformat()
        
        print(f"✅ Appointment created: {appointment_id}")
        
        return {
            'success': True,
            'appointmentId': appointment_id,
            'message': 'Appointment created successfully',
            'appointment': response_appointment
        }
        
    except Exception as e:
        print(f"❌ Error creating appointment: {e}")
        return {'success': False, 'message': str(e)}


def get_doctor_appointments(doctor_id, include_emergency=True):
    """
    Get appointments for a specific doctor
    
    Args:
        doctor_id (str): Doctor's ID
        include_emergency (bool): Include emergency appointments from other doctors
    
    Returns:
        list: List of appointments
    """
    if not db:
        return []
    
    try:
        appointments = []
        
        # Get doctor's own appointments (without ordering to avoid index requirement)
        appointments_ref = db.collection('appointments')
        query = appointments_ref.where('doctorId', '==', doctor_id)
        
        for doc in query.stream():
            appt = doc.to_dict()
            appt['id'] = doc.id
            appointments.append(appt)
        
        # Get emergency appointments from ALL doctors
        if include_emergency:
            emergency_query = appointments_ref.where('isEmergency', '==', True)
            
            for doc in emergency_query.stream():
                appt = doc.to_dict()
                appt['id'] = doc.id
                
                # Avoid duplicates (if doctor's own emergency appointment)
                if appt['doctorId'] != doctor_id:
                    appt['isOtherDoctorEmergency'] = True
                    appointments.append(appt)
        
        # Sort in Python instead of Firestore (to avoid index requirement)
        appointments.sort(key=lambda x: x.get('createdAt', datetime.now()), reverse=True)
        
        print(f"✅ Retrieved {len(appointments)} appointments for doctor {doctor_id}")
        return appointments
        
    except Exception as e:
        print(f"❌ Error getting doctor appointments: {e}")
        return []


def get_user_appointments(user_id):
    """
    Get appointments for a specific user
    
    Args:
        user_id (str): User's Firebase UID
    
    Returns:
        list: List of appointments
    """
    if not db:
        return []
    
    try:
        appointments = []
        appointments_ref = db.collection('appointments')
        query = appointments_ref.where('userId', '==', user_id)
        
        for doc in query.stream():
            appt = doc.to_dict()
            appt['id'] = doc.id
            appointments.append(appt)
        
        # Sort in Python instead of Firestore
        appointments.sort(key=lambda x: x.get('createdAt', datetime.now()), reverse=True)
        
        print(f"✅ Retrieved {len(appointments)} appointments for user {user_id}")
        return appointments
        
    except Exception as e:
        print(f"❌ Error getting user appointments: {e}")
        return []


def update_appointment_status(appointment_id, status):
    """
    Update appointment status
    
    Args:
        appointment_id (str): Appointment document ID
        status (str): New status (pending/confirmed/completed)
    
    Returns:
        dict: {success: bool, message: str}
    """
    if not db:
        return {'success': False, 'message': 'Database not available'}
    
    try:
        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        if status not in valid_statuses:
            return {'success': False, 'message': f'Invalid status. Must be one of: {valid_statuses}'}
        
        doc_ref = db.collection('appointments').document(appointment_id)
        doc_ref.update({
            'status': status,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        print(f"✅ Appointment {appointment_id} status updated to: {status}")
        
        return {
            'success': True,
            'message': f'Appointment status updated to {status}'
        }
        
    except Exception as e:
        print(f"❌ Error updating appointment status: {e}")
        return {'success': False, 'message': str(e)}


def get_all_doctors():
    """
    Get all users with role='doctor' from Firestore
    
    Returns:
        list: List of doctor profiles
    """
    if not db:
        return []
    
    try:
        doctors = []
        users_ref = db.collection('users')
        query = users_ref.where('role', '==', 'doctor')
        
        for doc in query.stream():
            doctor = doc.to_dict()
            doctor['id'] = doc.id
            doctors.append(doctor)
        
        print(f"✅ Retrieved {len(doctors)} doctors from database")
        return doctors
        
    except Exception as e:
        print(f"❌ Error getting doctors: {e}")
        return []


def delete_appointment(appointment_id):
    """
    Delete an appointment
    
    Args:
        appointment_id (str): Appointment document ID
    
    Returns:
        dict: {success: bool, message: str}
    """
    if not db:
        return {'success': False, 'message': 'Database not available'}
    
    try:
        db.collection('appointments').document(appointment_id).delete()
        print(f"✅ Appointment {appointment_id} deleted")
        
        return {
            'success': True,
            'message': 'Appointment deleted successfully'
        }
        
    except Exception as e:
        print(f"❌ Error deleting appointment: {e}")
        return {'success': False, 'message': str(e)}
