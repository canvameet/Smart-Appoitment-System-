"""
Firebase Cloud Messaging (FCM) Push Notification Service
Uses Firebase Admin SDK to send push notifications to devices.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Path to Firebase Admin SDK service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv(
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    'firebase-service-account.json'
)

# Flag to track initialization
_firebase_initialized = False
_fcm_available = False


def _initialize_firebase():
    """Initialize Firebase Admin SDK (called once)."""
    global _firebase_initialized, _fcm_available

    if _firebase_initialized:
        return

    _firebase_initialized = True

    if not os.path.exists(FIREBASE_SERVICE_ACCOUNT_PATH):
        print(f"[FCM] Service account file not found: {FIREBASE_SERVICE_ACCOUNT_PATH}")
        print("[FCM] Push notifications running in DEMO mode (logged only)")
        _fcm_available = False
        return

    try:
        import firebase_admin
        from firebase_admin import credentials

        # Check if already initialized (prevents duplicate initialization errors)
        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT_PATH)
            # Initialize with Storage bucket
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'loginapp-e7f18.firebasestorage.app'
            })

        _fcm_available = True
        print("[FCM] Firebase Admin SDK initialized successfully")

    except Exception as e:
        print(f"[FCM ERROR] Failed to initialize Firebase Admin: {e}")
        _fcm_available = False


def send_push(token: str, title: str, message: str, data: dict = None) -> dict:
    """
    Send a push notification via Firebase Cloud Messaging.
    
    Args:
        token: Device FCM registration token
        title: Notification title
        message: Notification body text
        data: Optional additional data payload
        
    Returns:
        dict with status and details
    """
    _initialize_firebase()

    if not _fcm_available:
        # Demo mode - log the notification
        print(f"[PUSH DEMO] Token: {token[:20]}..." if len(token) > 20 else f"[PUSH DEMO] Token: {token}")
        print(f"[PUSH DEMO] Title: {title}")
        print(f"[PUSH DEMO] Body: {message}")
        return {
            'success': True,
            'mode': 'demo',
            'message': 'Push notification logged (Firebase Admin not configured)',
            'token': token,
            'title': title,
            'body': message
        }

    try:
        from firebase_admin import messaging

        notification = messaging.Notification(
            title=title,
            body=message
        )

        fcm_message = messaging.Message(
            notification=notification,
            token=token,
            data=data or {}
        )

        response = messaging.send(fcm_message)
        print(f"[PUSH] Sent successfully | Response: {response}")

        return {
            'success': True,
            'mode': 'live',
            'response': response,
            'token': token
        }

    except Exception as e:
        print(f"[PUSH ERROR] Failed to send push notification: {e}")
        return {
            'success': False,
            'error': str(e),
            'token': token
        }


def send_push_to_topic(topic: str, title: str, message: str, data: dict = None) -> dict:
    """
    Send a push notification to a Firebase topic (e.g. 'doctors', 'emergencies').
    
    Args:
        topic: FCM topic name
        title: Notification title
        message: Notification body text
        data: Optional data payload
        
    Returns:
        dict with status and details
    """
    _initialize_firebase()

    if not _fcm_available:
        print(f"[PUSH DEMO] Topic: {topic} | Title: {title} | Body: {message}")
        return {
            'success': True,
            'mode': 'demo',
            'message': 'Topic push logged (Firebase Admin not configured)',
            'topic': topic
        }

    try:
        from firebase_admin import messaging

        fcm_message = messaging.Message(
            notification=messaging.Notification(title=title, body=message),
            topic=topic,
            data=data or {}
        )

        response = messaging.send(fcm_message)
        print(f"[PUSH TOPIC] Sent to topic '{topic}' | Response: {response}")

        return {
            'success': True,
            'mode': 'live',
            'response': response,
            'topic': topic
        }

    except Exception as e:
        print(f"[PUSH TOPIC ERROR] Failed: {e}")
        return {
            'success': False,
            'error': str(e),
            'topic': topic
        }
