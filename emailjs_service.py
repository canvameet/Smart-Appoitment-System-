"""
EmailJS Service - Backend helper for email sending
This module prepares data for EmailJS (frontend handles actual sending)
"""
from datetime import datetime


def send_report_to_both(patient_email, patient_name, doctor_email, doctor_name, pdf_url, report_data):
    """
    Prepare email data for sending to both patient and doctor
    
    Args:
        patient_email: Patient's email address
        patient_name: Patient's name
        doctor_email: Doctor's email address
        doctor_name: Doctor's name
        pdf_url: URL to download the PDF report
        report_data: Report data dictionary
    
    Returns:
        dict: {
            'success': bool,
            'patientSent': bool,
            'doctorSent': bool,
            'messages': list,
            'pdfUrl': str
        }
    """
    
    results = {
        'success': True,
        'patientSent': bool(patient_email),
        'doctorSent': bool(doctor_email),
        'messages': [],
        'pdfUrl': pdf_url
    }
    
    report_date = report_data.get('dateOfConsultation', datetime.now().strftime('%d-%m-%Y'))
    
    # Add messages
    if patient_email:
        results['messages'].append(f'Patient: Email will be sent to {patient_email}')
    else:
        results['messages'].append('Patient: No email address provided')
        results['patientSent'] = False
    
    if doctor_email:
        results['messages'].append(f'Doctor: Email will be sent to {doctor_email}')
    else:
        results['messages'].append('Doctor: No email address provided')
        results['doctorSent'] = False
    
    # Overall success if at least one email can be sent
    results['success'] = results['patientSent'] or results['doctorSent']
    
    if not pdf_url:
        results['success'] = False
        results['messages'].append('Error: PDF URL not available')
    
    return results


def prepare_email_data(recipient_email, recipient_name, patient_name, doctor_name, pdf_url, report_date, recipient_type='patient'):
    """
    Prepare email data for a single recipient
    
    Args:
        recipient_email: Recipient's email
        recipient_name: Recipient's name
        patient_name: Patient's name
        doctor_name: Doctor's name
        pdf_url: PDF download URL
        report_date: Report date
        recipient_type: 'patient' or 'doctor'
    
    Returns:
        dict: Email data ready for EmailJS
    """
    
    return {
        'to_email': recipient_email,
        'to_name': recipient_name,
        'patient_name': patient_name,
        'doctor_name': doctor_name,
        'report_date': report_date,
        'pdf_url': pdf_url,
        'recipient_type': recipient_type
    }
