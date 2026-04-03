"""
Doctor WhatsApp Emergency Alert Service
Sends emergency notifications to doctors via WhatsApp
"""
import os
from datetime import datetime
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')

# Initialize Twilio client
twilio_client = None

def initialize_twilio():
    """Initialize Twilio client"""
    global twilio_client
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print("⚠️  Twilio credentials not found")
        return False
    
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print("✅ Doctor WhatsApp service initialized")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Twilio: {e}")
        return False


def send_emergency_alert_to_doctor(doctor_phone, patient_data):
    """
    Send emergency alert to doctor via WhatsApp
    
    Args:
        doctor_phone (str): Doctor's WhatsApp number
        patient_data (dict): Patient information
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        # Clean phone number
        doctor_phone = doctor_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Extract patient info
        patient_name = patient_data.get('name', 'Unknown Patient')
        patient_age = patient_data.get('age', 'N/A')
        symptoms = patient_data.get('symptoms', 'Not specified')
        appointment_id = patient_data.get('id', 'N/A')
        time_slot = patient_data.get('time_slot', 'N/A')
        
        # Get triage info
        triage = patient_data.get('triage', {})
        severity = triage.get('severity', 'N/A')
        
        # Build emergency message
        message_body = f"""🚨 *EMERGENCY ALERT*

*New Emergency Patient Assigned*

👤 *Patient:* {patient_name}
📅 *Age:* {patient_age}
🆔 *ID:* {appointment_id}
🕐 *Time:* {time_slot}

⚠️ *Severity:* Level {severity}

📋 *Symptoms:*
{symptoms[:200]}

🚨 *Action Required:*
Patient has been moved to TOP of queue.
Please attend immediately.

_Sent from Smart Appointment System_"""
        
        # Format phone number for WhatsApp
        if not doctor_phone.startswith('whatsapp:'):
            doctor_phone_wa = f'whatsapp:{doctor_phone}'
        else:
            doctor_phone_wa = doctor_phone
        
        print(f"🚨 Sending emergency alert to doctor: {doctor_phone_wa}")
        
        # Send WhatsApp message
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=doctor_phone_wa
        )
        
        print(f"✅ Emergency WhatsApp sent to doctor {doctor_phone} - SID: {message.sid}")
        
        return {
            'success': True,
            'message_sid': message.sid,
            'to': doctor_phone
        }
        
    except Exception as e:
        print(f"❌ Failed to send doctor WhatsApp: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def send_new_patient_notification(doctor_phone, patient_data):
    """
    Send new patient notification to doctor via WhatsApp
    
    Args:
        doctor_phone (str): Doctor's WhatsApp number
        patient_data (dict): Patient information
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        # Clean phone number
        doctor_phone = doctor_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Extract patient info
        patient_name = patient_data.get('name', 'Unknown Patient')
        appointment_id = patient_data.get('id', 'N/A')
        time_slot = patient_data.get('time_slot', 'N/A')
        queue_position = patient_data.get('queue_position', 'N/A')
        
        # Build message
        message_body = f"""📋 *New Patient Appointment*

👤 *Patient:* {patient_name}
🆔 *ID:* {appointment_id}
🕐 *Time:* {time_slot}
📊 *Queue Position:* #{queue_position}

_Sent from Smart Appointment System_"""
        
        # Format phone number for WhatsApp
        if not doctor_phone.startswith('whatsapp:'):
            doctor_phone_wa = f'whatsapp:{doctor_phone}'
        else:
            doctor_phone_wa = doctor_phone
        
        # Send WhatsApp message
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=doctor_phone_wa
        )
        
        print(f"✅ Patient notification sent to doctor {doctor_phone}")
        
        return {
            'success': True,
            'message_sid': message.sid
        }
        
    except Exception as e:
        print(f"❌ Failed to send doctor notification: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# Initialize on module load
initialize_twilio()
