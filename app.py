"""
Smart Healthcare Appointment Scheduling API
Flask backend with AI Triage, ML Prediction, and Dynamic Queue Management.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback
import ml_model
import os
import scheduler as sched_engine
from scheduler import PatientStatus

# NEW: Import doctor schedule routes
from doctor_schedule_routes import doctor_schedule_bp

# NEW: Import appointment routes
from appointment_routes import appointment_bp

# NEW: Import WhatsApp service (replacing SMS)
import whatsapp_service
import doctor_whatsapp_service

# NEW: Import notification system (additive only)
from notification_routes import notification_bp
from notification_scheduler import start_notification_scheduler

# NEW: Import dataset/analytics routes (Kaggle No-Show dataset)
from dataset_routes import dataset_bp

# NEW: Import report generation routes
from report_routes import report_bp

app = Flask(__name__)
# Enable CORS allowing all origins for hackathon simplicity
CORS(app)

# NEW: Register doctor schedule blueprint
app.register_blueprint(doctor_schedule_bp)

# NEW: Register appointment blueprint
app.register_blueprint(appointment_bp)

# NEW: Register notification blueprint (additive only)
app.register_blueprint(notification_bp)

# NEW: Register dataset analytics blueprint
app.register_blueprint(dataset_bp)

# NEW: Register report generation blueprint
app.register_blueprint(report_bp)

print(" Initializing Healthcare Time Predictor...")
try:
    ml_model.initialize_predictor()
except Exception as e:
    print(f" Failed to initialize predictor: {e}")

# NEW: Initialize Kaggle dataset models (No-Show prediction + Analytics)
try:
    from noshow_predictor import initialize_all_models
    initialize_all_models()
except Exception as e:
    print(f" Dataset models init warning (non-blocking): {e}")

# ==============================================================================
# MOCK DATABASE & DYNAMIC QUEUE MANAGER
# ==============================================================================
DOCTORS = [
    {"id": "doc1", "name": "Dr. Sarah Adams (Cardiology)", "experience": 15, "phone": "+919876543210"},
    {"id": "doc2", "name": "Dr. John Smith (General)", "experience": 8, "phone": "+919876543211"},
    {"id": "doc3", "name": "Dr. Emily Chen (Pediatrics)", "experience": 12, "phone": "+919876543212"}
]

class QueueManager:
    def __init__(self):
        self.queue = []
        self.counter = 1

    def add_patient(self, appointment_data):
        appointment_data['id'] = f"A{self.counter:04d}"
        appointment_data['created_at'] = datetime.now().isoformat()
        self.counter += 1
        
        self.queue.append(appointment_data)
        self.reorder_queue()
        return appointment_data

    def reorder_queue(self):
        """
        Sort queue by priority:
        1. Emergency cases (Always top)
        2. Higher severity
        3. Wait time / earlier appointments
        """
        self.queue.sort(key=lambda x: (
            not x.get('triage', {}).get('is_emergency', False), # False comes first (0 < 1), so Emergency=True goes top
            -x.get('triage', {}).get('severity', 1),            # Higher severity negative => smaller value => top
            x['created_at']
        ))
        
        # Update queue positions
        for i, pt in enumerate(self.queue):
            pt['queue_position'] = i + 1

    def get_waiting_time(self):
        # Predict waiting time based on sum of consultation times before the last item...
        # For simplicity, returning the total backlog time in queue.
        total = sum(pt.get('predicted_time', 20) for pt in self.queue)
        return total

q_manager = QueueManager()

# ==============================================================================
# FLASK API ROUTES
# ==============================================================================

@app.route('/doctors', methods=['GET'])
def get_doctors():
    return jsonify({'success': True, 'doctors': DOCTORS}), 200

@app.route('/available-slots', methods=['POST'])
def get_slots():
    try:
        data = request.get_json()
        doctor_id = data.get('doctor_id')
        date = data.get('date')
        
        if not doctor_id or not date:
            return jsonify({'success': False, 'error': 'Missing doctor or date'}), 400
            
        # Get doctor schedules from Firebase
        import firebase_schedules
        doctor_schedule = firebase_schedules.get_doctor_schedules(doctor_id, date)
        
        # Get existing appointments from Firebase
        import firebase_appointments
        appointments = firebase_appointments.get_doctor_appointments(doctor_id, include_emergency=False)
        doc_appts = [a for a in appointments if a.get('date') == date]
        
        # Generate all possible time slots from 8:00 AM to 11:59 PM at 15-minute intervals
        base_times = []
        from datetime import datetime as dt, timedelta
        curr = dt.strptime("08:00 AM", "%I:%M %p")
        end_time = dt.strptime("11:59 PM", "%I:%M %p")
        
        while curr <= end_time:
            next_time = curr + timedelta(minutes=15)
            if next_time > end_time:
                break
            base_times.append(f"{curr.strftime('%I:%M %p')} - {next_time.strftime('%I:%M %p')}")
            curr = next_time
        
        # Filter out already booked slots
        taken_slots = [a.get('timeSlot') for a in doc_appts if a.get('timeSlot')]
        
        available = []
        for slot in base_times:
            if slot in taken_slots:
                continue
                
            # Parse slot time
            slot_start = slot.split(' - ')[0]
            slot_start_dt = dt.strptime(slot_start, "%I:%M %p")
            
            # If doctor has NO schedule for this date, all slots are available
            if not doctor_schedule:
                available.append(slot)
                continue
            
            # Check if slot falls within doctor's available schedule
            is_available = False
            for schedule in doctor_schedule:
                schedule_start = dt.strptime(schedule['startTime'], "%H:%M")
                schedule_end = dt.strptime(schedule['endTime'], "%H:%M")
                
                # Check if slot is within this schedule block AND status is Available
                if schedule_start <= slot_start_dt <= schedule_end and schedule['status'] == 'Available':
                    is_available = True
                    break
            
            if is_available:
                available.append(slot)
        
        return jsonify({'success': True, 'slots': available})
    except Exception as e:
        print(f"Error in get_slots: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': ml_model.predictor is not None
    })

@app.route('/queue', methods=['GET'])
def get_queue():
    q_manager.reorder_queue()
    return jsonify({
        'success': True,
        'queue': q_manager.queue,
        'waiting_time': q_manager.get_waiting_time()
    }), 200

@app.route('/waiting-time', methods=['GET'])
def get_waiting_time():
    return jsonify({
        'success': True,
        'waiting_time': q_manager.get_waiting_time(),
        'queue_length': len(q_manager.queue)
    }), 200

@app.route('/smart-book', methods=['POST'])
def smart_book():
    """
    Main Endpoint: Book appointment, run AI triage, run ML, add to queue.
    """
    try:
        data = request.get_json()
        if not data or 'symptoms' not in data:
            return jsonify({'success': False, 'error': 'Missing symptoms data'}), 400
            
        name = data.get('name', 'Unknown')
        age = int(data.get('age', 30))
        visit_type = int(data.get('visit_type', 0))
        symptoms = data.get('symptoms', '')
        
        doctor_id = data.get('doctor_id', 'doc2')
        appt_date = data.get('date', datetime.now().strftime("%Y-%m-%d"))
        time_slot = data.get('time_slot', '09:00 AM')

        # Validate doctor availability at the selected time slot
        from doctor_schedule_routes import doctor_schedules
        from datetime import datetime as dt
        
        slot_start = time_slot.split(' - ')[0]
        slot_start_dt = dt.strptime(slot_start, "%I:%M %p")
        
        doctor_schedule = [s for s in doctor_schedules if s['doctor_id'] == doctor_id and s['date'] == appt_date]
        
        is_doctor_available = False
        unavailable_reason = ""
        
        if not doctor_schedule:
            # No schedule means doctor is available by default
            is_doctor_available = True
        else:
            # Check if the time slot falls within an available schedule
            for schedule in doctor_schedule:
                schedule_start = dt.strptime(schedule['start_time'], "%H:%M")
                schedule_end = dt.strptime(schedule['end_time'], "%H:%M")
                
                if schedule_start <= slot_start_dt <= schedule_end:
                    if schedule['status'] == 'Available':
                        is_doctor_available = True
                        break
                    else:
                        unavailable_reason = f"Doctor is {schedule['status'].lower()}"
                        if schedule.get('reason'):
                            unavailable_reason += f" ({schedule['reason']})"
                        break
        
        if not is_doctor_available and doctor_schedule:
            return jsonify({
                'success': False,
                'error': f'Doctor unavailable at selected time. {unavailable_reason}',
                'doctor_unavailable': True
            }), 400

        doctor_name = "Unknown"
        # Find doctor experience
        doctor_experience = 10
        for d in DOCTORS:
            if d['id'] == doctor_id:
                doctor_experience = d['experience']
                doctor_name = d['name']
                break
                
        past_avg_time = 0.0
        
        # Prepare for ML/AI
        symptom_data = {
            "symptoms": symptoms,
            "age": age,
            "visit_type": visit_type,
            "past_avg_time": past_avg_time,
            "doctor_experience": doctor_experience
        }
        
        print(f" Processing AI Triage and ML Predict for: {name}")
        result = ml_model.predict_from_symptoms(symptom_data)
        
        # Formulate final payload
        appointment = {
            "name": name,
            "age": age,
            "visit_type": visit_type,
            "symptoms": symptoms,
            "triage": result['triage'],
            "predicted_time": result['predicted_time'],
            "recommendation": result['recommendation'],
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "date": appt_date,
            "time_slot": time_slot
        }
        
        # Append to legacy queue (for QueueDashboard compatibility)
        final_appt = q_manager.add_patient(appointment)

        # Also inject into the Dynamic Rescheduling Engine
        sched_engine.add_patient_to_engine(final_appt)

        # NEW: Send WhatsApp confirmation to patient
        patient_phone = data.get('phone')
        whatsapp_sent = False
        whatsapp_sid = None
        
        if patient_phone:
            wa_result = whatsapp_service.send_appointment_confirmation(patient_phone, final_appt)
            if wa_result['success']:
                print(f"✅ WhatsApp confirmation sent to {patient_phone}")
                whatsapp_sent = True
                whatsapp_sid = wa_result.get('message_sid')
                
                # Send emergency alert WhatsApp if flagged
                if result.get('triage', {}).get('is_emergency', False):
                    whatsapp_service.send_emergency_alert(patient_phone, final_appt)
                    print(f"🚨 Emergency WhatsApp alert sent to {patient_phone}")
            else:
                print(f"⚠️  WhatsApp failed: {wa_result.get('error')}")
        else:
            print("ℹ️  No phone number provided, skipping WhatsApp")
        
        final_appt['whatsapp_sent'] = whatsapp_sent
        if whatsapp_sid:
            final_appt['whatsapp_sid'] = whatsapp_sid

        # NEW: Send emergency WhatsApp alert to doctor if flagged
        if result.get('triage', {}).get('is_emergency', False):
            # Get doctor phone number
            doctor_phone = None
            for d in DOCTORS:
                if d['id'] == doctor_id:
                    doctor_phone = d.get('phone')
                    break
            
            if doctor_phone:
                doctor_wa_result = doctor_whatsapp_service.send_emergency_alert_to_doctor(
                    doctor_phone, 
                    final_appt
                )
                if doctor_wa_result['success']:
                    print(f"🚨 Emergency WhatsApp sent to doctor {doctor_phone}")
                else:
                    print(f"⚠️  Doctor WhatsApp failed: {doctor_wa_result.get('error')}")
            else:
                print(f"⚠️  No phone number found for doctor {doctor_id}")

        # NEW: Send emergency notification to doctor if AI triage flagged emergency
        try:
            if result.get('triage', {}).get('is_emergency', False):
                from notification_service import send_emergency_alert
                send_emergency_alert(
                    doctor_id=doctor_id,
                    patient_name=name,
                    doctor_phone=None,  # Add doctor phone from DB in production
                    doctor_token=None   # Add doctor FCM token from DB in production
                )
                print(f" 🚨 Emergency notification sent for patient: {name}")
        except Exception as notif_err:
            print(f" [NOTIF WARNING] Emergency alert failed (non-blocking): {notif_err}")

        return jsonify({
            'success': True,
            'appointment': final_appt,
            'message': 'Successfully scheduled and processed!',
            'whatsapp_sent': whatsapp_sent
        }), 200

    except Exception as e:
        print(f"Error in smart-book: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai-triage', methods=['POST'])
def ai_triage():
    """
    Independent AI triage endpoint for live testing or chatbots.
    """
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        if not symptoms:
            return jsonify({'success': False, 'error': 'Missing symptoms'}), 400
            
        triage = ml_model.predictor.analyze_symptoms(symptoms)
        
        return jsonify({'success': True, 'triage': triage}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ==============================================================================
# DYNAMIC RESCHEDULING ENGINE ROUTES
# ==============================================================================

@app.route('/reschedule/update-status', methods=['POST'])
def update_patient_status():
    """
    Trigger rescheduling when a patient's status changes.
    Body: { patientId, status, arrivalTime (optional ISO string) }

    Scenarios triggered automatically:
      - Scenario A: If patient checked in late (>15 min), priority is downgraded
      - Scenario B: If high-priority patient arrives early, priority is upgraded
    """
    try:
        data = request.get_json()
        patient_id = data.get('patientId')
        new_status = data.get('status')
        arrival_str = data.get('arrivalTime')

        if not patient_id or not new_status:
            return jsonify({'success': False, 'error': 'patientId and status are required'}), 400

        # Map string to enum
        status_map = {
            'Waiting': PatientStatus.WAITING,
            'Checked-in': PatientStatus.CHECKED_IN,
            'Delayed': PatientStatus.DELAYED,
            'In-Progress': PatientStatus.IN_PROGRESS,
            'Completed': PatientStatus.COMPLETED,
        }
        status_enum = status_map.get(new_status)
        if not status_enum:
            return jsonify({'success': False, 'error': f'Invalid status: {new_status}'}), 400

        arrival_dt = None
        if arrival_str:
            # Strip 'Z' or '+00:00' to make it naive, matching other datetimes in the system
            arrival_dt = datetime.fromisoformat(arrival_str.replace('Z', '').split('+')[0])

        engine = sched_engine.get_engine()
        engine.updateStatus(patient_id, status_enum, arrival_dt)

        return jsonify({
            'success': True,
            'queue': engine.getQueue(),
            'notifications': engine.notifications_log[-5:]  # last 5 notifications
        }), 200

    except Exception as e:
        print(f"RESCHEDULER_ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/reschedule/emergency', methods=['POST'])
def escalate_emergency():
    """
    Scenario C: Immediately escalate a patient to Emergency (Priority 0).
    Forces them to absolute top of queue and triggers rescheduleQueue().
    Body: { patientId }
    """
    try:
        data = request.get_json()
        patient_id = data.get('patientId')

        if not patient_id:
            return jsonify({'success': False, 'error': 'patientId required'}), 400

        engine = sched_engine.get_engine()
        engine.markEmergency(patient_id)

        return jsonify({
            'success': True,
            'message': f'{patient_id} escalated to EMERGENCY and moved to top of queue.',
            'queue': engine.getQueue(),
            'notifications': engine.notifications_log[-5:]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/reschedule/queue', methods=['GET'])
def get_rescheduled_queue():
    """
    Get the current dynamically ordered priority queue from the engine.
    """
    engine = sched_engine.get_engine()
    return jsonify({
        'success': True,
        'queue': engine.getQueue(),
        'total': len(engine.all_tasks),
        'notifications_triggered': len(engine.notifications_log)
    }), 200


@app.route('/reschedule/notifications', methods=['GET'])
def get_notifications():
    """Return the full notification history from the engine."""
    engine = sched_engine.get_engine()
    return jsonify({
        'success': True,
        'notifications': engine.notifications_log
    }), 200


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("SMART HEALTHCARE QUEUE SYS - FLASK API")
    print("=" * 80)

    # NEW: Start notification reminder scheduler (checks every 60s for upcoming appointments)
    start_notification_scheduler(
        queue_getter=lambda: q_manager.queue,
        interval_seconds=60
    )
    print(" 🔔 Notification scheduler started")

    app.run(host='0.0.0.0', port=5000, debug=True)