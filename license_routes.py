"""
Software License Payment Routes
Handles one-time ₹199 payment for admin access
"""
from flask import Blueprint, request, jsonify
import razorpay
import os
from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import service_account

load_dotenv()

license_bp = Blueprint('license', __name__)

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.getenv('RAZORPAY_KEY_ID'),
    os.getenv('RAZORPAY_KEY_SECRET')
))

LICENSE_COLLECTION = 'software_licenses'
LICENSE_AMOUNT = 199  # ₹199


def get_firestore_db():
    """Get Firestore client instance"""
    try:
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'loginapp-e7f18-firebase-adminsdk-fbsvc-766ae828f0.json')
        
        if os.path.exists(service_account_path):
            credentials = service_account.Credentials.from_service_account_file(service_account_path)
            db = firestore.Client(credentials=credentials, project='loginapp-e7f18')
            return db
        else:
            raise Exception("Firebase service account file not found")
    except Exception as e:
        raise Exception(f"Failed to initialize Firestore: {e}")


@license_bp.route('/license/check/<user_id>', methods=['GET'])
def check_license_status(user_id):
    """
    Check if user has paid for software license
    """
    try:
        db = get_firestore_db()
        doc_ref = db.collection(LICENSE_COLLECTION).document(user_id)
        doc = doc_ref.get()
        
        if doc.exists:
            data = doc.to_dict()
            return jsonify({
                'success': True,
                'isPaid': data.get('isPaid', False),
                'payment_id': data.get('payment_id', ''),
                'paid_at': data.get('paid_at', '')
            }), 200
        else:
            return jsonify({
                'success': True,
                'isPaid': False
            }), 200
            
    except Exception as e:
        print(f"❌ License check failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@license_bp.route('/license/create-order', methods=['POST'])
def create_license_order():
    """
    Create Razorpay order for software license payment
    Body: {
        user_id: str,
        user_email: str,
        amount: int (should be 199)
    }
    """
    try:
        db = get_firestore_db()
        data = request.get_json()
        user_id = data.get('user_id')
        user_email = data.get('user_email')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400
        
        # Check if already paid
        doc_ref = db.collection(LICENSE_COLLECTION).document(user_id)
        doc = doc_ref.get()
        
        if doc.exists and doc.to_dict().get('isPaid', False):
            return jsonify({
                'success': False,
                'error': 'License already purchased'
            }), 400
        
        # Convert amount to paise
        amount_in_paise = LICENSE_AMOUNT * 100
        
        # Create Razorpay order
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f"license_{user_id}",
            'notes': {
                'user_id': user_id,
                'user_email': user_email,
                'product': 'Smart Hospital System License'
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        print(f"✅ License order created: {order['id']} for user {user_id}")
        
        return jsonify({
            'success': True,
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency']
        }), 200
        
    except Exception as e:
        print(f"❌ License order creation failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@license_bp.route('/license/verify', methods=['POST'])
def verify_license_payment():
    """
    Verify Razorpay payment and activate license
    Body: {
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        user_id: str
    }
    """
    try:
        db = get_firestore_db()
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': data['razorpay_order_id'],
            'razorpay_payment_id': data['razorpay_payment_id'],
            'razorpay_signature': data['razorpay_signature']
        }
        
        # This will raise an exception if signature is invalid
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get payment details
        payment = razorpay_client.payment.fetch(data['razorpay_payment_id'])
        
        # Save license to Firestore
        from datetime import datetime
        license_data = {
            'user_id': user_id,
            'isPaid': True,
            'payment_id': data['razorpay_payment_id'],
            'order_id': data['razorpay_order_id'],
            'amount': LICENSE_AMOUNT,
            'currency': 'INR',
            'payment_method': payment.get('method', ''),
            'paid_at': datetime.now().isoformat(),
            'status': 'active'
        }
        
        doc_ref = db.collection(LICENSE_COLLECTION).document(user_id)
        doc_ref.set(license_data)
        
        print(f"✅ License activated for user {user_id} | Payment: {data['razorpay_payment_id']}")
        
        return jsonify({
            'success': True,
            'message': 'License activated successfully',
            'payment_id': data['razorpay_payment_id']
        }), 200
        
    except razorpay.errors.SignatureVerificationError:
        print("❌ License payment signature verification failed")
        return jsonify({
            'success': False,
            'error': 'Invalid payment signature'
        }), 400
    except Exception as e:
        print(f"❌ License verification failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@license_bp.route('/license/all', methods=['GET'])
def get_all_licenses():
    """
    Admin: Get all software licenses (for tracking)
    """
    try:
        db = get_firestore_db()
        licenses_ref = db.collection(LICENSE_COLLECTION)
        docs = licenses_ref.stream()
        
        licenses = []
        for doc in docs:
            license_data = doc.to_dict()
            license_data['id'] = doc.id
            licenses.append(license_data)
        
        return jsonify({
            'success': True,
            'licenses': licenses,
            'total': len(licenses),
            'total_revenue': len([l for l in licenses if l.get('isPaid')]) * LICENSE_AMOUNT
        }), 200
        
    except Exception as e:
        print(f"❌ Failed to fetch licenses: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
