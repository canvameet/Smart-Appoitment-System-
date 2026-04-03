"""
Doctor Availability API Routes
NEW ENDPOINTS ONLY - Does not modify existing routes
"""
from flask import Blueprint, request, jsonify
from doctor_availability import get_schedule_manager
from datetime import datetime

# Create a Blueprint for availability routes
availability_bp = Blueprint('availability', __name__, url_prefix='/doctor')

@availability_bp.route('/schedule/add', methods=['POST'])
def add_schedule():
    """
    Add a new schedule entry for a doctor.
    
    POST /doctor/schedule/add
    Body: