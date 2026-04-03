"""
Doctor Schedule Management Routes
Handles doctor availability scheduling for admin and patient viewing
NOW INTEGRATED WITH FIREBASE FIRESTORE
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import firebase_schedules

# Create Blueprint for doctor scheduling
doctor_schedule_bp = Blueprint('doctor_schedule', __name__)

# ==============================================================================
# ADMIN ENDPOINTS - Doctor Schedule Management
# ==============================================================================

@doctor_schedule_bp.route('/doctor/schedule/add', methods=['POST'])
def add_doctor_schedule():
    """
    Admin: Add new doctor schedule to Firebase
    Body: {
        doctor_id: str,
        doctor_name: str,
        date: str (YYYY-MM-DD),
        start_time: str (HH:MM),
        end_time: str (HH:MM),
        status: str (Available/Busy/Blocked),
        reason: str (optional)
    }
    """
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['doctor_id', 'doctor_name', 'date', 'start_time', 'end_time', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Validate status
        valid_statuses = ['Available', 'Busy', 'Blocked']
        if data['status'] not in valid_statuses:
            return jsonify({'success': False, 'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        # Convert to Firebase format (camelCase)
        schedule_data = {
            'doctorId': data['doctor_id'],
            'doctorName': data['doctor_name'],
            'date': data['date'],
            'startTime': data['start_time'],
            'endTime': data['end_time'],
            'status': data['status'],
            'reason': data.get('reason', '')
        }
        
        # Add to Firebase
        result = firebase_schedules.add_schedule(schedule_data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'scheduleId': result['scheduleId'],
                'message': result['message']
            }), 201
        else:
            return jsonify({'success': False, 'error': result['message']}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@doctor_schedule_bp.route('/doctor/schedule/<doctor_id>', methods=['GET'])
def get_doctor_schedule(doctor_id):
    """
    Get all schedules for a specific doctor from Firebase
    Query params: date (optional) - filter by specific date
    """
    try:
        date_filter = request.args.get('date')
        
        # Get schedules from Firebase
        schedules = firebase_schedules.get_doctor_schedules(doctor_id, date_filter)
        
        # Convert to API format (snake_case)
        formatted_schedules = []
        for s in schedules:
            formatted_schedules.append({
                'id': s['id'],
                'doctor_id': s['doctorId'],
                'doctor_name': s['doctorName'],
                'date': s['date'],
                'start_time': s['startTime'],
                'end_time': s['endTime'],
                'status': s['status'],
                'reason': s.get('reason', '')
            })
        
        return jsonify({
            'success': True,
            'schedules': formatted_schedules,
            'total': len(formatted_schedules)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@doctor_schedule_bp.route('/doctor/schedule/all', methods=['GET'])
def get_all_schedules():
    """
    Admin: Get all doctor schedules from Firebase
    Query params: date (optional) - filter by specific date
    """
    try:
        date_filter = request.args.get('date')
        
        # Get all schedules from Firebase
        schedules = firebase_schedules.get_all_schedules(date_filter)
        
        # Convert to API format (snake_case)
        formatted_schedules = []
        for s in schedules:
            formatted_schedules.append({
                'id': s['id'],
                'doctor_id': s['doctorId'],
                'doctor_name': s['doctorName'],
                'date': s['date'],
                'start_time': s['startTime'],
                'end_time': s['endTime'],
                'status': s['status'],
                'reason': s.get('reason', '')
            })
        
        return jsonify({
            'success': True,
            'schedules': formatted_schedules,
            'total': len(formatted_schedules)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@doctor_schedule_bp.route('/doctor/schedule/update/<schedule_id>', methods=['PUT'])
def update_doctor_schedule(schedule_id):
    """
    Admin: Update existing doctor schedule in Firebase
    Body: Same as add, but all fields optional
    """
    try:
        data = request.get_json()
        
        # Convert to Firebase format (camelCase)
        update_data = {}
        field_mapping = {
            'doctor_id': 'doctorId',
            'doctor_name': 'doctorName',
            'date': 'date',
            'start_time': 'startTime',
            'end_time': 'endTime',
            'status': 'status',
            'reason': 'reason'
        }
        
        for api_field, firebase_field in field_mapping.items():
            if api_field in data:
                update_data[firebase_field] = data[api_field]
        
        # Update in Firebase
        result = firebase_schedules.update_schedule(schedule_id, update_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@doctor_schedule_bp.route('/doctor/schedule/delete/<schedule_id>', methods=['DELETE'])
def delete_doctor_schedule(schedule_id):
    """
    Admin: Delete doctor schedule from Firebase
    """
    try:
        result = firebase_schedules.delete_schedule(schedule_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==============================================================================
# PATIENT ENDPOINTS - View Available Slots (READ-ONLY)
# ==============================================================================

@doctor_schedule_bp.route('/doctor/available-slots/<doctor_id>', methods=['GET'])
def get_available_slots(doctor_id):
    """
    Patient: Get ONLY available slots for a doctor from Firebase
    Query params: date (required) - specific date to check
    Returns: Only slots with status='Available'
    """
    try:
        date = request.args.get('date')
        if not date:
            return jsonify({'success': False, 'error': 'Date parameter is required'}), 400
        
        # Get available slots from Firebase
        slots = firebase_schedules.get_available_slots(doctor_id, date)
        
        return jsonify({
            'success': True,
            'doctor_id': doctor_id,
            'date': date,
            'available_slots': slots,
            'total': len(slots)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@doctor_schedule_bp.route('/doctor/schedule/status/<doctor_id>', methods=['GET'])
def get_doctor_status(doctor_id):
    """
    Patient: Check if doctor is available on a specific date from Firebase
    Query params: date (required)
    """
    try:
        date = request.args.get('date')
        if not date:
            return jsonify({'success': False, 'error': 'Date parameter is required'}), 400
        
        # Get doctor status from Firebase
        status = firebase_schedules.get_doctor_status(doctor_id, date)
        
        return jsonify({
            'success': True,
            'doctor_id': doctor_id,
            'date': date,
            **status
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ==============================================================================
# UTILITY ENDPOINTS
# ==============================================================================

@doctor_schedule_bp.route('/doctor/schedule/bulk-add', methods=['POST'])
def bulk_add_schedules():
    """
    Admin: Add multiple schedules at once to Firebase
    Body: { schedules: [...] }
    """
    try:
        data = request.get_json()
        schedules_data = data.get('schedules', [])
        
        if not schedules_data:
            return jsonify({'success': False, 'error': 'No schedules provided'}), 400
        
        added_schedules = []
        failed_schedules = []
        
        for schedule_data in schedules_data:
            # Convert to Firebase format
            firebase_data = {
                'doctorId': schedule_data['doctor_id'],
                'doctorName': schedule_data['doctor_name'],
                'date': schedule_data['date'],
                'startTime': schedule_data['start_time'],
                'endTime': schedule_data['end_time'],
                'status': schedule_data['status'],
                'reason': schedule_data.get('reason', '')
            }
            
            result = firebase_schedules.add_schedule(firebase_data)
            
            if result['success']:
                added_schedules.append(result['scheduleId'])
            else:
                failed_schedules.append(schedule_data)
        
        return jsonify({
            'success': True,
            'total_added': len(added_schedules),
            'total_failed': len(failed_schedules),
            'message': f'{len(added_schedules)} schedules added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
