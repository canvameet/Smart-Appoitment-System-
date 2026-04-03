"""
Appointment Management API Routes
Flask Blueprint for appointment CRUD operations
"""
from flask import Blueprint, request, jsonify
import firebase_appointments
import whatsapp_service
import doctor_whatsapp_service

appointment_bp = Blueprint('appointments', __name__)


@appointment_bp.route('/appointments/check-limit', methods=['POST'])
def check_appointment_limit():
    """
    Check if user can book more appointments today
    Body: {userId, date}
    """
    try:
        data = request.get_json()
        user_id = data.get('userId')
        date = data.get('date')
        
        if not user_id or not date:
            return jsonify({'success': False, 'error': 'userId and date are required'}), 400
        
        result = firebase_appointments.check_daily_appointment_limit(user_id, date)
        
        return jsonify({
            'success': True,
            'canBook': result['can_book'],
            'count': result['count'],
            'message': result['message']
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/appointments/create', methods=['POST'])
def create_appointment():
    """
    Create new appointment with daily limit check
    Body: {userId, doctorId, date, timeSlot, isEmergency, patientName, patientAge, patientPhone, symptoms, triage}
    """
    try:
        data = request.get_json()
        
        # Create appointment in Firestore
        result = firebase_appointments.create_appointment(data)
        
        if not result['success']:
            if result.get('limit_reached'):
                return jsonify(result), 429  # Too Many Requests
            return jsonify(result), 400
        
        appointment = result['appointment']
        appointment_id = result['appointmentId']
        
        # Send WhatsApp to patient
        patient_phone = data.get('patientPhone')
        if patient_phone:
            appointment['id'] = appointment_id
            wa_result = whatsapp_service.send_appointment_confirmation(patient_phone, appointment)
            if wa_result['success']:
                print(f"✅ WhatsApp sent to patient {patient_phone}")
        
        # If emergency, send WhatsApp to doctor
        if appointment.get('isEmergency'):
            # Get doctor phone from database
            doctors = firebase_appointments.get_all_doctors()
            doctor = next((d for d in doctors if d['id'] == data.get('doctorId')), None)
            
            if doctor and doctor.get('phone'):
                doctor_phone = doctor['phone']
                appointment['id'] = appointment_id
                appointment['name'] = data.get('patientName')
                appointment['age'] = data.get('patientAge')
                
                doc_wa_result = doctor_whatsapp_service.send_emergency_alert_to_doctor(
                    doctor_phone,
                    appointment
                )
                if doc_wa_result['success']:
                    print(f"🚨 Emergency WhatsApp sent to doctor {doctor_phone}")
        
        return jsonify({
            'success': True,
            'appointmentId': appointment_id,
            'message': result['message'],
            'appointment': appointment
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating appointment: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/appointments/doctor/<doctor_id>', methods=['GET'])
def get_doctor_appointments(doctor_id):
    """
    Get appointments for a specific doctor
    Includes doctor's own appointments + all emergency appointments
    """
    try:
        appointments = firebase_appointments.get_doctor_appointments(doctor_id)
        
        return jsonify({
            'success': True,
            'appointments': appointments,
            'total': len(appointments)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/appointments/user/<user_id>', methods=['GET'])
def get_user_appointments(user_id):
    """
    Get appointments for a specific user
    """
    try:
        appointments = firebase_appointments.get_user_appointments(user_id)
        
        return jsonify({
            'success': True,
            'appointments': appointments,
            'total': len(appointments)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/appointments/<appointment_id>/status', methods=['PUT'])
def update_appointment_status(appointment_id):
    """
    Update appointment status
    Body: {status: 'pending'|'confirmed'|'completed'|'cancelled'}
    """
    try:
        data = request.get_json()
        status = data.get('status')
        
        if not status:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        result = firebase_appointments.update_appointment_status(appointment_id, status)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/appointments/<appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    """
    Delete an appointment
    """
    try:
        result = firebase_appointments.delete_appointment(appointment_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@appointment_bp.route('/doctors/list', methods=['GET'])
def list_doctors():
    """
    Get all registered doctors from Firestore
    Only returns users with role='doctor'
    """
    try:
        doctors = firebase_appointments.get_all_doctors()
        
        # Format for frontend
        formatted_doctors = []
        for doctor in doctors:
            formatted_doctors.append({
                'id': doctor['id'],
                'name': doctor.get('name', 'Unknown Doctor'),
                'email': doctor.get('email', ''),
                'phone': doctor.get('phone', ''),
                'specialty': doctor.get('specialty', 'General'),
                'experience': doctor.get('experience', 5)
            })
        
        return jsonify({
            'success': True,
            'doctors': formatted_doctors,
            'total': len(formatted_doctors)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
