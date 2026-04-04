"""
Razorpay Payment Integration Routes
Handles payment creation, verification, and transaction management
"""
from flask import Blueprint, request, jsonify
import razorpay
import os
from dotenv import load_dotenv
import firebase_appointments

load_dotenv()

payment_bp = Blueprint('payment', __name__)

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.getenv('RAZORPAY_KEY_ID'),
    os.getenv('RAZORPAY_KEY_SECRET')
))

@payment_bp.route('/payment/create-order', methods=['POST'])
def create_payment_order():
    """
    Create a Razorpay order for appointment payment
    Body: {
        amount: int (in rupees),
        appointment_id: str,
        patient_name: str,
        patient_email: str
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['amount', 'appointment_id', 'patient_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        # Convert amount to paise (Razorpay uses smallest currency unit)
        amount_in_paise = int(data['amount']) * 100
        
        # Create Razorpay order
        order_data = {
            'amount': amount_in_paise,
            'currency': 'INR',
            'receipt': f"apt_{data['appointment_id']}",
            'notes': {
                'appointment_id': data['appointment_id'],
                'patient_name': data['patient_name'],
                'patient_email': data.get('patient_email', '')
            }
        }
        
        order = razorpay_client.order.create(data=order_data)
        
        return jsonify({
            'success': True,
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'key_id': os.getenv('RAZORPAY_KEY_ID')
        }), 200
        
    except Exception as e:
        print(f"❌ Payment order creation failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@payment_bp.route('/payment/verify', methods=['POST'])
def verify_payment():
    """
    Verify Razorpay payment signature
    Body: {
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        appointment_id: str
    }
    """
    try:
        data = request.get_json()
        
        # Verify signature
        params_dict = {
            'razorpay_order_id': data['razorpay_order_id'],
            'razorpay_payment_id': data['razorpay_payment_id'],
            'razorpay_signature': data['razorpay_signature']
        }
        
        # This will raise an exception if signature is invalid
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update appointment with payment info
        appointment_id = data.get('appointment_id')
        if appointment_id:
            payment_data = {
                'payment_status': 'paid',
                'payment_id': data['razorpay_payment_id'],
                'order_id': data['razorpay_order_id'],
                'payment_method': 'razorpay'
            }
            firebase_appointments.update_appointment(appointment_id, payment_data)
        
        print(f"✅ Payment verified successfully: {data['razorpay_payment_id']}")
        
        return jsonify({
            'success': True,
            'message': 'Payment verified successfully',
            'payment_id': data['razorpay_payment_id']
        }), 200
        
    except razorpay.errors.SignatureVerificationError:
        print("❌ Payment signature verification failed")
        return jsonify({
            'success': False,
            'error': 'Invalid payment signature'
        }), 400
    except Exception as e:
        print(f"❌ Payment verification failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@payment_bp.route('/payment/status/<payment_id>', methods=['GET'])
def get_payment_status(payment_id):
    """
    Get payment status from Razorpay
    """
    try:
        payment = razorpay_client.payment.fetch(payment_id)
        
        return jsonify({
            'success': True,
            'payment': {
                'id': payment['id'],
                'amount': payment['amount'] / 100,  # Convert paise to rupees
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment.get('method', ''),
                'email': payment.get('email', ''),
                'contact': payment.get('contact', ''),
                'created_at': payment['created_at']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Failed to fetch payment status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@payment_bp.route('/payment/refund', methods=['POST'])
def create_refund():
    """
    Create a refund for a payment
    Body: {
        payment_id: str,
        amount: int (optional, in rupees - full refund if not provided)
    }
    """
    try:
        data = request.get_json()
        payment_id = data.get('payment_id')
        
        if not payment_id:
            return jsonify({'success': False, 'error': 'Payment ID required'}), 400
        
        refund_data = {'payment_id': payment_id}
        
        # If amount specified, convert to paise
        if 'amount' in data:
            refund_data['amount'] = int(data['amount']) * 100
        
        refund = razorpay_client.refund.create(data=refund_data)
        
        print(f"✅ Refund created: {refund['id']}")
        
        return jsonify({
            'success': True,
            'refund_id': refund['id'],
            'amount': refund['amount'] / 100,
            'status': refund['status']
        }), 200
        
    except Exception as e:
        print(f"❌ Refund creation failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@payment_bp.route('/payment/transactions', methods=['GET'])
def get_all_transactions():
    """
    Admin: Get all payment transactions
    Query params: count (default 10), skip (default 0)
    """
    try:
        count = int(request.args.get('count', 10))
        skip = int(request.args.get('skip', 0))
        
        payments = razorpay_client.payment.all({
            'count': count,
            'skip': skip
        })
        
        transactions = []
        for payment in payments['items']:
            transactions.append({
                'id': payment['id'],
                'amount': payment['amount'] / 100,
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment.get('method', ''),
                'email': payment.get('email', ''),
                'contact': payment.get('contact', ''),
                'created_at': payment['created_at'],
                'description': payment.get('description', '')
            })
        
        return jsonify({
            'success': True,
            'transactions': transactions,
            'total': len(transactions)
        }), 200
        
    except Exception as e:
        print(f"❌ Failed to fetch transactions: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
