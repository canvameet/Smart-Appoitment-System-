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

app = Flask(__name__)
# Enable CORS allowing all origins for hackathon simplicity
CORS(app)

print(" Initializing Healthcare Time Predictor...")
try:
    ml_model.initialize_predictor()
except Exception as e:
    print(f" Failed to initialize predictor: {e}")

# ==============================================================================
# MOCK DATABASE & DYNAMIC QUEUE MANAGER
# ==============================================================================
DOCTORS = [
    {"id": "doc1", "name": "Dr. Sarah Adams (Cardiology)", "experience": 15},
    {"id": "doc2", "name": "Dr. John Smith (General)", "experience": 8},
    {"id": "doc3", "name": "Dr. Emily Chen (Pediatrics)", "experience": 12}
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
            
        # Find all appointments for this doctor on this exact date
        doc_appts = [a for a in q_manager.queue if a.get('doctor_id') == doctor_id and a.get('date') == date]
        
        # Base smart slots - dynamically stripping out booked ones
        base_times = ["09:00 AM", "09:45 AM", "10:20 AM", "11:10 AM", "01:00 PM", "01:35 PM", "02:15 PM", "03:00 PM", "04:15 PM"]
        taken_slots = [a.get('time_slot') for a in doc_appts if a.get('time_slot')]
        available = [t for t in base_times if t not in taken_slots]
        
        return jsonify({'success': True, 'slots': available})
    except Exception as e:
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

        return jsonify({
            'success': True,
            'appointment': final_appt,
            'message': 'Successfully scheduled and processed!'
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
    app.run(host='0.0.0.0', port=5000, debug=True)