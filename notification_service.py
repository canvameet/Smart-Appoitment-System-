"""
Unified Notification Service
Handles SMS + Push + Database storage for all notification types.
Uses SQLite for the notifications table.
"""
import sqlite3
import os
import uuid
from datetime import datetime
from typing import Optional, List, Dict

# Import SMS service functions
try:
    from sms_service import send_appointment_confirmation, send_emergency_alert
    
    # Create wrapper function for compatibility
    def send_sms(phone_number, message):
        """Wrapper function to send SMS using Twilio service"""
        try:
            from twilio.rest import Client
            TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
            TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
            TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
            
            if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
                return {'success': False, 'error': 'Twilio not configured'}
            
            client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            msg = client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            return {'success': True, 'message_sid': msg.sid}
        except Exception as e:
            return {'success': False, 'error': str(e)}
            
except ImportError:
    # Fallback if SMS service not available
    def send_appointment_confirmation(*args, **kwargs):
        return {'success': False, 'error': 'SMS service not available'}
    def send_emergency_alert(*args, **kwargs):
        return {'success': False, 'error': 'SMS service not available'}
    def send_sms(*args, **kwargs):
        return {'success': False, 'error': 'SMS service not available'}

# Import push service functions
try:
    from push_service import send_push, send_push_to_topic
except ImportError:
    # Fallback if push service not available
    def send_push(*args, **kwargs):
        return {'success': False, 'error': 'Push service not available'}
    def send_push_to_topic(*args, **kwargs):
        return {'success': False, 'error': 'Push service not available'}

# ============================================================================
# DATABASE SETUP (SQLite)
# ============================================================================

DB_PATH = os.path.join(os.path.dirname(__file__), 'notifications.db')


def _get_db():
    """Get a SQLite database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_notifications_db():
    """Create the notifications table if it doesn't exist."""
    conn = _get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('emergency', 'reminder', 'info')),
            sent_via TEXT NOT NULL CHECK(sent_via IN ('sms', 'push', 'both')),
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read', 'failed')),
            device_token TEXT,
            phone_number TEXT,
            metadata TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("[NOTIF DB] Notifications database initialized")


# Initialize on import
init_notifications_db()


# ============================================================================
# CORE NOTIFICATION FUNCTIONS
# ============================================================================

def send_notification(
    user_id: str,
    message: str,
    notif_type: str,
    phone_number: str = None,
    device_token: str = None,
    title: str = "MediCare System",
    metadata: dict = None
) -> dict:
    """
    Unified notification dispatcher.
    Sends SMS + Push + stores in database.
    
    Args:
        user_id: Unique user identifier (doctor_id, patient_id, etc.)
        message: Notification message body
        notif_type: 'emergency' | 'reminder' | 'info'
        phone_number: Phone number for SMS (optional)
        device_token: FCM token for push notification (optional)
        title: Push notification title
        metadata: Extra data (optional)
        
    Returns:
        dict with combined results
    """
    results = {
        'sms': None,
        'push': None,
        'db': None,
        'notification_id': None
    }

    sent_via = 'both'

    # ── Send SMS ──────────────────────────────────────────────────────────
    if phone_number:
        results['sms'] = send_sms(phone_number, message)
    else:
        sent_via = 'push'

    # ── Send Push Notification ────────────────────────────────────────────
    if device_token:
        results['push'] = send_push(device_token, title, message, metadata)
    elif not phone_number:
        # If neither phone nor token, use topic-based push as fallback
        topic = 'doctors' if notif_type == 'emergency' else 'patients'
        results['push'] = send_push_to_topic(topic, title, message, metadata)
        sent_via = 'push'
    else:
        if not device_token:
            sent_via = 'sms'

    # ── Store in Database ─────────────────────────────────────────────────
    notification_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().isoformat()

    try:
        conn = _get_db()
        conn.execute('''
            INSERT INTO notifications (id, user_id, message, type, sent_via, timestamp, status, device_token, phone_number, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            notification_id,
            user_id,
            message,
            notif_type,
            sent_via,
            timestamp,
            'sent',
            device_token or '',
            phone_number or '',
            str(metadata) if metadata else ''
        ))
        conn.commit()
        conn.close()

        results['db'] = {'success': True, 'id': notification_id}
        results['notification_id'] = notification_id
        print(f"[NOTIF] #{notification_id} | {notif_type.upper()} | To: {user_id} | Via: {sent_via}")

    except Exception as e:
        print(f"[NOTIF DB ERROR] {e}")
        results['db'] = {'success': False, 'error': str(e)}

    return results


def get_notifications_for_user(user_id: str, limit: int = 50) -> List[Dict]:
    """
    Fetch notifications for a specific user.
    
    Args:
        user_id: User identifier
        limit: Max number of notifications to return
        
    Returns:
        List of notification dicts
    """
    conn = _get_db()
    rows = conn.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_all_notifications(limit: int = 100) -> List[Dict]:
    """Fetch all recent notifications."""
    conn = _get_db()
    rows = conn.execute(
        'SELECT * FROM notifications ORDER BY timestamp DESC LIMIT ?',
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def mark_notification_read(notification_id: str) -> bool:
    """Mark a notification as read."""
    conn = _get_db()
    conn.execute(
        'UPDATE notifications SET status = ? WHERE id = ?',
        ('read', notification_id)
    )
    conn.commit()
    conn.close()
    return True


def get_unread_count(user_id: str) -> int:
    """Get count of unread notifications for a user."""
    conn = _get_db()
    row = conn.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status != ?',
        (user_id, 'read')
    ).fetchone()
    conn.close()
    return row['count'] if row else 0


# ============================================================================
# HIGH-LEVEL NOTIFICATION SENDERS
# ============================================================================

def send_emergency_alert(doctor_id: str, patient_name: str, doctor_phone: str = None, doctor_token: str = None):
    """
    Send emergency alert to doctor when AI triage marks a patient as emergency.
    
    Args:
        doctor_id: Doctor identifier
        patient_name: Name of the emergency patient
        doctor_phone: Doctor's phone number (optional)
        doctor_token: Doctor's FCM device token (optional)
    """
    message = f"🚨 EMERGENCY ALERT: Patient '{patient_name}' has been flagged as emergency by AI triage. Please attend immediately."

    return send_notification(
        user_id=doctor_id,
        message=message,
        notif_type='emergency',
        phone_number=doctor_phone,
        device_token=doctor_token,
        title="🚨 Emergency Patient Alert",
        metadata={'patient_name': patient_name, 'priority': 'critical'}
    )


def send_appointment_reminder(patient_id: str, patient_name: str, doctor_name: str, time_slot: str, patient_phone: str = None, patient_token: str = None):
    """
    Send appointment reminder to patient 10 minutes before their slot.
    
    Args:
        patient_id: Patient identifier
        patient_name: Patient's name
        doctor_name: Doctor's name
        time_slot: Appointment time slot
        patient_phone: Patient's phone number (optional)
        patient_token: Patient's FCM device token (optional)
    """
    message = f"⏰ Reminder: Hi {patient_name}, your appointment with {doctor_name} is in 10 minutes ({time_slot}). Please be ready."

    return send_notification(
        user_id=patient_id,
        message=message,
        notif_type='reminder',
        phone_number=patient_phone,
        device_token=patient_token,
        title="⏰ Appointment Reminder",
        metadata={'doctor_name': doctor_name, 'time_slot': time_slot}
    )
