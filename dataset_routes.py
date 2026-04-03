"""
Dataset Analytics & No-Show Prediction API Routes
NEW Blueprint — does NOT modify any existing routes.
"""
from flask import Blueprint, request, jsonify
from noshow_predictor import (
    initialize_all_models,
    consultation_predictor,
    noshow_predictor,
    patient_analytics
)

dataset_bp = Blueprint('dataset', __name__)


# ============================================================================
# MODEL A: Consultation Time Prediction
# ============================================================================

@dataset_bp.route('/dataset/predict-time', methods=['POST'])
def predict_consultation_time():
    """
    Predict consultation time using real Kaggle data-trained model.
    Body: { age, gender, hipertension, diabetes, alcoholism, handicap, days_gap }
    """
    try:
        data = request.get_json()
        result = consultation_predictor.predict(data)
        return jsonify({'success': True, **result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# MODEL B: No-Show Prediction
# ============================================================================

@dataset_bp.route('/dataset/predict-noshow', methods=['POST'])
def predict_noshow():
    """
    Predict if a patient will miss their appointment.
    Body: {
        age, gender, scholarship, hipertension, diabetes,
        alcoholism, handicap, sms_received, days_gap,
        day_of_week, hour_of_day
    }
    """
    try:
        data = request.get_json()
        result = noshow_predictor.predict(data)
        return jsonify({'success': True, **result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# MODEL C: Patient Analytics & Dashboard Data
# ============================================================================

@dataset_bp.route('/dataset/analytics', methods=['GET'])
def get_analytics():
    """Get full dashboard analytics from 110K+ real hospital records."""
    try:
        stats = patient_analytics.get_dashboard_data()
        if not stats:
            return jsonify({
                'success': False,
                'error': 'Analytics not yet initialized'
            }), 503
        return jsonify({'success': True, 'analytics': stats}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@dataset_bp.route('/dataset/risk-profile', methods=['POST'])
def get_risk_profile():
    """
    Get comprehensive risk profile for a patient.
    Body: { age, hipertension, diabetes, alcoholism, handicap, days_gap, sms_received }
    """
    try:
        data = request.get_json()
        profile = patient_analytics.get_risk_profile(data)
        return jsonify({'success': True, 'profile': profile}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@dataset_bp.route('/dataset/model-metrics', methods=['GET'])
def get_model_metrics():
    """Get training metrics for all models."""
    try:
        return jsonify({
            'success': True,
            'consultation_model': consultation_predictor.stats,
            'noshow_model': noshow_predictor.metrics,
            'dataset_size': patient_analytics.stats.get('total_appointments', 0)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
