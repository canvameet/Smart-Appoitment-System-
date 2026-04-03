"""
Notification API Routes (Flask Blueprint)
NEW module - does NOT modify any existing routes.
Provides endpoints for notification management.
"""
from flask import Blueprint, request, jsonify
from notification_service import (
    send_notification,
    get_notifications_for_user,
    get_all_notifications,
    mark_notification_read,
    get_unread_count,
    send_emergency_alert,
    send_appointment_reminder
)

notification_bp = Blueprint('notifications', __name__)


# ============================================================================
# NOTIFICATION API ENDPOINTS
# ============================================================================

@notification_bp.route('/notifications/send-test', methods=['POST'])
def send_test_notification():
    """
    Send a test notification (for debugging / demo purposes).
    Body: {
        user_id: str,
        message: str (optional),
        type: str (optional, default: 'info'),
        phone_number: str (optional),
        device_token: str (optional)
    }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'test_user')
        message = data.get('message', '🔔 This is a test notification from MediCare System.')
        notif_type = data.get('type', 'info')
        phone = data.get('phone_number')
        token = data.get('device_token')

        result = send_notification(
            user_id=user_id,
            message=message,
            notif_type=notif_type,
            phone_number=phone,
            device_token=token,
            title="Test Notification"
        )

        return jsonify({
            'success': True,
            'result': result,
            'message': 'Test notification dispatched'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notification_bp.route('/notifications/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """
    Get all notifications for a specific user.
    Query params: limit (optional, default 50)
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        notifications = get_notifications_for_user(user_id, limit)
        unread = get_unread_count(user_id)

        return jsonify({
            'success': True,
            'notifications': notifications,
            'unread_count': unread,
            'total': len(notifications)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notification_bp.route('/notifications/all', methods=['GET'])
def get_all_notifs():
    """Get all notifications (admin view)."""
    try:
        limit = request.args.get('limit', 100, type=int)
        notifications = get_all_notifications(limit)

        return jsonify({
            'success': True,
            'notifications': notifications,
            'total': len(notifications)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notification_bp.route('/notifications/mark-read/<notification_id>', methods=['POST'])
def mark_read(notification_id):
    """Mark a single notification as read."""
    try:
        mark_notification_read(notification_id)
        return jsonify({
            'success': True,
            'message': f'Notification {notification_id} marked as read'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notification_bp.route('/notifications/unread-count/<user_id>', methods=['GET'])
def unread_count(user_id):
    """Get unread notification count for badge display."""
    try:
        count = get_unread_count(user_id)
        return jsonify({
            'success': True,
            'unread_count': count
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notification_bp.route('/notifications/register-token', methods=['POST'])
def register_device_token():
    """
    Register a device token for push notifications.
    Body: { user_id, device_token }
    Stores in a simple in-memory registry (replace with DB in production).
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        token = data.get('device_token')

        if not user_id or not token:
            return jsonify({'success': False, 'error': 'user_id and device_token required'}), 400

        # Store in the device registry
        device_token_registry[user_id] = token

        return jsonify({
            'success': True,
            'message': f'Device token registered for {user_id}'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# In-memory device token registry (production: use Firestore/DB)
device_token_registry = {}
