"""
Medical Report Generation Routes
Flask Blueprint for PDF report generation and hospital settings
"""
from flask import Blueprint, request, jsonify, send_file
import hospital_settings
import pdf_report_generator
import email_service
import firebase_appointments
from datetime import datetime
import os
import tempfile
import io

report_bp = Blueprint('reports', __name__)


@report_bp.route('/hospital/settings', methods=['GET'])
def get_hospital_settings():
    """Get hospital settings"""
    try:
        settings = hospital_settings.get_hospital_settings()
        return jsonify({
            'success': True,
            'settings': settings
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@report_bp.route('/hospital/settings', methods=['PUT'])
def update_hospital_settings():
    """
    Update hospital settings
    Body: {
        hospitalName, address, contactNumber, email, website, logoUrl, footerText
    }
    """
    try:
        data = request.get_json()
        result = hospital_settings.update_hospital_settings(data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@report_bp.route('/report/generate', methods=['POST'])
def generate_report():
    """
    Generate medical report PDF and save to appointment history
    Body: {
        patientName, age, gender, dateOfConsultation,
        symptoms, diagnosis, medicines, recommendations,
        followUpInstructions, additionalNotes, doctorName,
        patientEmail (optional), doctorEmail (optional),
        sendEmail (optional, default: false),
        appointmentId (optional) - to save report to appointment
    }
    """
    try:
        report_data = request.get_json()
        
        # Validate required fields
        required_fields = ['patientName', 'doctorName']
        for field in required_fields:
            if field not in report_data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Get hospital settings
        hosp_settings = hospital_settings.get_hospital_settings()
        
        # Generate PDF
        pdf_buffer = pdf_report_generator.generate_medical_report(
            report_data,
            hosp_settings
        )
        
        # Save report to appointment if appointmentId provided
        appointment_id = report_data.get('appointmentId')
        if appointment_id:
            try:
                print(f"💾 Saving report to appointment: {appointment_id}")
                firebase_appointments.update_appointment(
                    appointment_id,
                    {
                        'reportData': report_data,
                        'reportGeneratedAt': datetime.now().isoformat(),
                        'status': 'completed'  # Mark as completed when report is generated
                    }
                )
                print(f"✅ Report saved to appointment history")
            except Exception as save_error:
                print(f"⚠️ Warning: Failed to save report to appointment: {save_error}")
        
        # Check if email should be sent
        send_email = report_data.get('sendEmail', False)
        email_results = None
        
        if send_email:
            patient_email = report_data.get('patientEmail')
            doctor_email = report_data.get('doctorEmail')
            
            if patient_email or doctor_email:
                # Import emailjs service
                import emailjs_service
                
                email_results = emailjs_service.send_report_to_both(
                    patient_email=patient_email,
                    patient_name=report_data.get('patientName', 'Patient'),
                    doctor_email=doctor_email,
                    doctor_name=report_data.get('doctorName', 'Doctor'),
                    pdf_url='',  # Not used anymore
                    report_data=report_data
                )
                
                print(f"📧 Email results: {email_results}")
        
        # Generate filename
        patient_name = report_data.get('patientName', 'Patient').replace(' ', '_')
        date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"Medical_Report_{patient_name}_{date_str}.pdf"
        
        # Reset buffer for download
        pdf_buffer.seek(0)
        
        # Return PDF file with email status
        response = send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
        # Add email status to response headers
        if email_results:
            response.headers['X-Email-Sent'] = 'true' if email_results['success'] else 'false'
            response.headers['X-Email-Status'] = '; '.join(email_results['messages'])
        
        return response
        
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@report_bp.route('/report/preview', methods=['POST'])
def preview_report():
    """
    Generate report preview (returns PDF in browser)
    Same as generate but with as_attachment=False
    """
    try:
        report_data = request.get_json()
        
        # Get hospital settings
        hosp_settings = hospital_settings.get_hospital_settings()
        
        # Generate PDF
        pdf_buffer = pdf_report_generator.generate_medical_report(
            report_data,
            hosp_settings
        )
        
        # Return PDF for preview
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=False
        )
        
    except Exception as e:
        print(f"❌ Error generating preview: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@report_bp.route('/report/parse-transcript', methods=['POST'])
def parse_transcript():
    """
    Parse consultation transcript and extract structured data
    Body: {
        transcript: str,
        language: str (optional, default: 'English')
    }
    """
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')
        language = data.get('language', 'English')
        
        if not transcript:
            return jsonify({
                'success': False,
                'error': 'Transcript is required'
            }), 400
        
        # Parse transcript
        report_data = pdf_report_generator.parse_consultation_transcript(
            transcript,
            language
        )
        
        return jsonify({
            'success': True,
            'reportData': report_data,
            'message': 'Transcript parsed successfully. Please review and edit the extracted data.'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@report_bp.route('/email/test', methods=['GET'])
def test_email():
    """
    Test email configuration
    """
    try:
        result = email_service.test_email_configuration()
        return jsonify(result), 200 if result['configured'] else 500
    except Exception as e:
        return jsonify({
            'configured': False,
            'message': f'Error testing email: {str(e)}'
        }), 500


@report_bp.route('/email/send-test', methods=['POST'])
def send_test_email():
    """
    Send a test email
    Body: { email: str }
    """
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({'success': False, 'error': 'Email address required'}), 400
        
        # Create a simple test PDF
        import io
        test_pdf = io.BytesIO(b'%PDF-1.4\nTest PDF content')
        
        test_report_data = {
            'patientName': 'Test Patient',
            'age': '30',
            'gender': 'Male',
            'dateOfConsultation': datetime.now().strftime('%d-%m-%Y'),
            'doctorName': 'Test Doctor'
        }
        
        result = email_service.send_report_email(
            recipient_email=test_email,
            recipient_name='Test User',
            pdf_buffer=test_pdf,
            report_data=test_report_data,
            recipient_type='patient'
        )
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
