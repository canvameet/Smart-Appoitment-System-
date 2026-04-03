"""
Hospital Settings Management
Handles hospital configuration storage in Firebase Firestore
"""
import os
from google.cloud import firestore
from google.oauth2 import service_account

# Initialize Firestore
def initialize_firestore():
    """Initialize Firestore client"""
    try:
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'loginapp-e7f18-firebase-adminsdk-fbsvc-766ae828f0.json')
        
        if os.path.exists(service_account_path):
            credentials = service_account.Credentials.from_service_account_file(service_account_path)
            db = firestore.Client(credentials=credentials, project='loginapp-e7f18')
            print("✅ Firestore (Hospital Settings) initialized successfully")
            return db
        else:
            print("⚠️  Firebase service account file not found")
            return None
    except Exception as e:
        print(f"❌ Failed to initialize Firestore (Hospital Settings): {e}")
        return None

db = initialize_firestore()

# Default hospital settings
DEFAULT_SETTINGS = {
    'hospitalName': 'Smart Medical Center',
    'address': '123 Healthcare Avenue, Medical District',
    'contactNumber': '+91-1234567890',
    'email': 'info@smartmedical.com',
    'website': 'www.smartmedical.com',
    'logoUrl': '',
    'footerText': 'Powered by Smart Management System'
}


def get_hospital_settings():
    """
    Get hospital settings from Firestore
    
    Returns:
        dict: Hospital settings
    """
    if not db:
        return DEFAULT_SETTINGS.copy()
    
    try:
        # Get settings document
        doc_ref = db.collection('hospital_settings').document('config')
        doc = doc_ref.get()
        
        if doc.exists:
            settings = doc.to_dict()
            print("✅ Hospital settings retrieved from Firestore")
            return settings
        else:
            # Create default settings if not exists
            doc_ref.set(DEFAULT_SETTINGS)
            print("✅ Default hospital settings created in Firestore")
            return DEFAULT_SETTINGS.copy()
            
    except Exception as e:
        print(f"❌ Error getting hospital settings: {e}")
        return DEFAULT_SETTINGS.copy()


def update_hospital_settings(settings_data):
    """
    Update hospital settings in Firestore
    
    Args:
        settings_data (dict): Settings to update
            - hospitalName
            - address
            - contactNumber
            - email
            - website
            - logoUrl
            - footerText
    
    Returns:
        dict: {success: bool, message: str}
    """
    if not db:
        return {'success': False, 'message': 'Database not available'}
    
    try:
        # Get current settings
        doc_ref = db.collection('hospital_settings').document('config')
        current_settings = get_hospital_settings()
        
        # Update with new data
        updated_settings = {**current_settings, **settings_data}
        
        # Save to Firestore
        doc_ref.set(updated_settings)
        
        print(f"✅ Hospital settings updated")
        
        return {
            'success': True,
            'message': 'Hospital settings updated successfully',
            'settings': updated_settings
        }
        
    except Exception as e:
        print(f"❌ Error updating hospital settings: {e}")
        return {'success': False, 'message': str(e)}


def reset_hospital_settings():
    """
    Reset hospital settings to defaults
    
    Returns:
        dict: {success: bool, message: str}
    """
    if not db:
        return {'success': False, 'message': 'Database not available'}
    
    try:
        doc_ref = db.collection('hospital_settings').document('config')
        doc_ref.set(DEFAULT_SETTINGS)
        
        print("✅ Hospital settings reset to defaults")
        
        return {
            'success': True,
            'message': 'Hospital settings reset to defaults',
            'settings': DEFAULT_SETTINGS.copy()
        }
        
    except Exception as e:
        print(f"❌ Error resetting hospital settings: {e}")
        return {'success': False, 'message': str(e)}
