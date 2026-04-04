"""
History Routes - Appointment and Report History
Flask Blueprint for managing appointment history and medical reports
"""
from flask import Blueprint, request, jsonify
import firebase_appointments
from datetime import datetime

history_bp = Blueprint('history', __name__)


@history_bp.route('/history/patient/<patient_id>', methods=['GET'])
def get_patient_history(patient_id):
    """
    Get appointment history for a specific patient
    Returns all appointments (completed, cancelled, etc.) with report data
    """
    try:
        # Get all appointments for this patient
        all_appointments = firebase_appointments.get_appointments_by_patient(patient_id)
        
        if not all_appointments['success']:
            return jsonify({
                'success': False,
                'error': all_appointments.get('error', 'Failed to fetch history')
            }), 500
        
        appointments = all_appointments.get('appointments', [])
        
        # Sort by date (newest first)
        appointments.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Separate by status
        completed = [apt for apt in appointments if apt.get('status') == 'completed']
        cancelled = [apt for apt in appointments if apt.get('status') == 'cancelled']
        upcoming = [apt for apt in appointments if apt.get('status') in ['pending', 'confirmed']]
        
        return jsonify({
            'success': True,
            'history': {
                'completed': completed,
                'cancelled': cancelled,
                'upcoming': upcoming,
                'total': len(appointments)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching patient history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@history_bp.route('/history/admin', methods=['GET'])
def get_admin_history():
    """
    Get all appointment history for admin dashboard
    Query params:
    - status: filter by status (completed, cancelled, all)
    - limit: number of records (default: 100)
    - doctor_id: filter by doctor
    """
    try:
        status_filter = request.args.get('status', 'all')
        limit = int(request.args.get('limit', 100))
        doctor_id = request.args.get('doctor_id', None)
        
        # Get all appointments
        all_appointments = firebase_appointments.get_all_appointments()
        
        if not all_appointments['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch appointments'
            }), 500
        
        appointments = all_appointments.get('appointments', [])
        
        # Filter by doctor if specified
        if doctor_id:
            appointments = [apt for apt in appointments if apt.get('doctorId') == doctor_id]
        
        # Filter by status
        if status_filter != 'all':
            appointments = [apt for apt in appointments if apt.get('status') == status_filter]
        
        # Sort by date (newest first)
        appointments.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Limit results
        appointments = appointments[:limit]
        
        # Calculate statistics
        total_completed = len([a for a in appointments if a.get('status') == 'completed'])
        total_cancelled = len([a for a in appointments if a.get('status') == 'cancelled'])
        total_pending = len([a for a in appointments if a.get('status') in ['pending', 'confirmed']])
        
        return jsonify({
            'success': True,
            'appointments': appointments,
            'statistics': {
                'total': len(appointments),
                'completed': total_completed,
                'cancelled': total_cancelled,
                'pending': total_pending
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching admin history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@history_bp.route('/history/appointment/<appointment_id>/report', methods=['GET'])
def get_appointment_report(appointment_id):
    """
    Get medical report for a specific appointment
    """
    try:
        # Get appointment details
        appointment = firebase_appointments.get_appointment_by_id(appointment_id)
        
        if not appointment['success']:
            return jsonify({
                'success': False,
                'error': 'Appointment not found'
            }), 404
        
        apt_data = appointment.get('appointment', {})
        
        # Check if report exists
        report_data = apt_data.get('reportData', None)
        
        if not report_data:
            return jsonify({
                'success': False,
                'error': 'No report available for this appointment'
            }), 404
        
        return jsonify({
            'success': True,
            'report': report_data,
            'appointment': {
                'id': appointment_id,
                'date': apt_data.get('date'),
                'doctorName': apt_data.get('doctorName'),
                'patientName': apt_data.get('patientName')
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching appointment report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@history_bp.route('/history/appointment/<appointment_id>/report', methods=['POST'])
def save_appointment_report(appointment_id):
    """
    Save medical report to appointment
    Body: { reportData: {...} }
    """
    try:
        data = request.get_json()
        report_data = data.get('reportData')
        
        if not report_data:
            return jsonify({
                'success': False,
                'error': 'Report data is required'
            }), 400
        
        # Update appointment with report data
        result = firebase_appointments.update_appointment(
            appointment_id,
            {
                'reportData': report_data,
                'reportGeneratedAt': datetime.now().isoformat()
            }
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Report saved successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to save report')
            }), 500
        
    except Exception as e:
        print(f"❌ Error saving appointment report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@history_bp.route('/history/stats', methods=['GET'])
def get_history_stats():
    """
    Get overall statistics for admin dashboard
    """
    try:
        # Get all appointments
        all_appointments = firebase_appointments.get_all_appointments()
        
        if not all_appointments['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch statistics'
            }), 500
        
        appointments = all_appointments.get('appointments', [])
        
        # Calculate statistics
        total = len(appointments)
        completed = len([a for a in appointments if a.get('status') == 'completed'])
        cancelled = len([a for a in appointments if a.get('status') == 'cancelled'])
        pending = len([a for a in appointments if a.get('status') in ['pending', 'confirmed']])
        emergency = len([a for a in appointments if a.get('isEmergency') == True])
        
        # Reports generated
        with_reports = len([a for a in appointments if a.get('reportData') is not None])
        
        # By doctor
        doctors = {}
        for apt in appointments:
            doctor_id = apt.get('doctorId', 'Unknown')
            doctor_name = apt.get('doctorName', 'Unknown')
            if doctor_id not in doctors:
                doctors[doctor_id] = {
                    'name': doctor_name,
                    'total': 0,
                    'completed': 0
                }
            doctors[doctor_id]['total'] += 1
            if apt.get('status') == 'completed':
                doctors[doctor_id]['completed'] += 1
        
        return jsonify({
            'success': True,
            'statistics': {
                'total': total,
                'completed': completed,
                'cancelled': cancelled,
                'pending': pending,
                'emergency': emergency,
                'withReports': with_reports,
                'byDoctor': list(doctors.values())
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching statistics: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
