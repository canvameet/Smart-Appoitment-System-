"""
Twilio WhatsApp Notification Service
Sends appointment confirmations and updates to patients via WhatsApp
More reliable than SMS, especially in India
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
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')  # Twilio Sandbox

# Initialize Twilio client
twilio_client = None

def initialize_twilio():
    """Initialize Twilio client with credentials from environment"""
    global twilio_client
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print("⚠️  Twilio credentials not found in .env file")
        print("   WhatsApp notifications will be disabled")
        return False
    
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        print("✅ Twilio WhatsApp service initialized successfully")
        print(f"   Using WhatsApp number: {TWILIO_WHATSAPP_NUMBER}")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Twilio: {e}")
        return False


def send_appointment_confirmation(patient_phone, appointment_data):
    """
    Send appointment confirmation via WhatsApp
    
    Args:
        patient_phone (str): Patient's phone number (format: +1234567890)
        appointment_data (dict): Appointment details
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        # Clean phone number - remove spaces and special characters except +
        patient_phone = patient_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Format appointment details
        name = appointment_data.get('name', 'Patient')
        doctor_name = appointment_data.get('doctor_name', 'Doctor')
        date = appointment_data.get('date', 'N/A')
        time_slot = appointment_data.get('time_slot', 'N/A')
        appointment_id = appointment_data.get('id', 'N/A')
        
        # Format date for better readability
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            formatted_date = date_obj.strftime("%B %d, %Y")
        except:
            formatted_date = date
        
        # Get severity info
        triage = appointment_data.get('triage', {})
        severity = triage.get('severity', 'N/A')
        is_emergency = triage.get('is_emergency', False)
        
        # Build message
        message_body = f"""🏥 *Appointment Confirmed!*

Hello *{name}*,

Your appointment has been scheduled:

📅 *Date:* {formatted_date}
🕐 *Time:* {time_slot}
👨‍⚕️ *Doctor:* {doctor_name}
🆔 *ID:* {appointment_id}

*Priority:* {"🚨 EMERGENCY" if is_emergency else f"Severity {severity}"}

Please arrive 10 minutes early.

For changes, contact the hospital.

Thank you!"""
        
        # Format phone number for WhatsApp
        if not patient_phone.startswith('whatsapp:'):
            patient_phone_wa = f'whatsapp:{patient_phone}'
        else:
            patient_phone_wa = patient_phone
        
        print(f"📱 Sending WhatsApp to: {patient_phone_wa}")
        
        # Send WhatsApp message
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=patient_phone_wa
        )
        
        print(f"✅ WhatsApp sent to {patient_phone} - SID: {message.sid}")
        
        return {
            'success': True,
            'message_sid': message.sid,
            'to': patient_phone
        }
        
    except Exception as e:
        print(f"❌ Failed to send WhatsApp: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def send_appointment_reminder(patient_phone, appointment_data):
    """
    Send appointment reminder via WhatsApp
    
    Args:
        patient_phone (str): Patient's phone number
        appointment_data (dict): Appointment details
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        name = appointment_data.get('name', 'Patient')
        doctor_name = appointment_data.get('doctor_name', 'Doctor')
        time_slot = appointment_data.get('time_slot', 'N/A')
        
        message_body = f"""🔔 *Appointment Reminder*

Hello *{name}*,

This is a reminder for your appointment:

👨‍⚕️ *Doctor:* {doctor_name}
🕐 *Time:* {time_slot}

Please arrive on time.

Thank you!"""
        
        # Format phone number for WhatsApp
        if not patient_phone.startswith('whatsapp:'):
            patient_phone_wa = f'whatsapp:{patient_phone}'
        else:
            patient_phone_wa = patient_phone
        
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=patient_phone_wa
        )
        
        print(f"✅ WhatsApp reminder sent to {patient_phone}")
        
        return {
            'success': True,
            'message_sid': message.sid
        }
        
    except Exception as e:
        print(f"❌ Failed to send WhatsApp reminder: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def send_queue_update(patient_phone, queue_position, estimated_wait):
    """
    Send queue position update via WhatsApp
    
    Args:
        patient_phone (str): Patient's phone number
        queue_position (int): Current position in queue
        estimated_wait (int): Estimated wait time in minutes
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        message_body = f"""📊 *Queue Update*

Your current position: *#{queue_position}*

Estimated wait time: *~{estimated_wait} minutes*

We'll notify you when it's your turn.

Thank you for your patience!"""
        
        # Format phone number for WhatsApp
        if not patient_phone.startswith('whatsapp:'):
            patient_phone_wa = f'whatsapp:{patient_phone}'
        else:
            patient_phone_wa = patient_phone
        
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=patient_phone_wa
        )
        
        print(f"✅ WhatsApp queue update sent to {patient_phone}")
        
        return {
            'success': True,
            'message_sid': message.sid
        }
        
    except Exception as e:
        print(f"❌ Failed to send WhatsApp queue update: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def send_emergency_alert(patient_phone, appointment_data):
    """
    Send emergency priority alert via WhatsApp
    
    Args:
        patient_phone (str): Patient's phone number
        appointment_data (dict): Appointment details
    
    Returns:
        dict: Success status and message SID or error
    """
    if not twilio_client:
        return {'success': False, 'error': 'Twilio not initialized'}
    
    try:
        # Clean phone number - remove spaces and special characters except +
        patient_phone = patient_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        name = appointment_data.get('name', 'Patient')
        
        message_body = f"""🚨 *EMERGENCY PRIORITY ALERT*

Hello *{name}*,

Your case has been marked as *EMERGENCY*.

You have been moved to the *TOP* of the queue.

⚠️ Please proceed to the reception *IMMEDIATELY*.

Medical staff will attend to you shortly."""
        
        # Format phone number for WhatsApp
        if not patient_phone.startswith('whatsapp:'):
            patient_phone_wa = f'whatsapp:{patient_phone}'
        else:
            patient_phone_wa = patient_phone
        
        message = twilio_client.messages.create(
            body=message_body,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=patient_phone_wa
        )
        
        print(f"✅ WhatsApp emergency alert sent to {patient_phone}")
        
        return {
            'success': True,
            'message_sid': message.sid
        }
        
    except Exception as e:
        print(f"❌ Failed to send WhatsApp emergency alert: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# Initialize on module load
initialize_twilio()
