"""
Email Service for sending PDF reports
Uses Gmail SMTP (free) to send medical reports to patients and doctors
"""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Gmail SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv('SMTP_EMAIL')
SENDER_PASSWORD = os.getenv('SMTP_PASSWORD')  # App-specific password
SENDER_NAME = os.getenv('HOSPITAL_NAME', 'Smart Medical Center')


def send_report_email(recipient_email, recipient_name, pdf_buffer, report_data, recipient_type='patient'):
    """
    Send medical report PDF via email
    
    Args:
        recipient_email (str): Recipient's email address
        recipient_name (str): Recipient's name
        pdf_buffer (BytesIO): PDF file buffer
        report_data (dict): Report data for email body
        recipient_type (str): 'patient' or 'doctor'
    
    Returns:
        dict: {success: bool, message: str}
    """
    
    print(f"\n📧 Attempting to send email to {recipient_email} ({recipient_type})")
    print(f"   SMTP_EMAIL configured: {bool(SENDER_EMAIL)}")
    print(f"   SMTP_PASSWORD configured: {bool(SENDER_PASSWORD)}")
    
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        error_msg = 'Email service not configured. Please set SMTP_EMAIL and SMTP_PASSWORD in .env file'
        print(f"❌ {error_msg}")
        return {
            'success': False,
            'message': error_msg
        }
    
    if not recipient_email:
        error_msg = f'No email address provided for {recipient_type}'
        print(f"❌ {error_msg}")
        return {
            'success': False,
            'message': error_msg
        }
    
    try:
        print(f"   Creating email message...")
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = recipient_email
        msg['Subject'] = f"Medical Report - {report_data.get('patientName', 'Patient')}"
        
        # Email body based on recipient type
        if recipient_type == 'patient':
            body = f"""
Dear {recipient_name},

Your medical consultation report is ready and attached to this email.

Patient Details:
- Name: {report_data.get('patientName', 'N/A')}
- Age: {report_data.get('age', 'N/A')}
- Gender: {report_data.get('gender', 'N/A')}
- Date: {report_data.get('dateOfConsultation', datetime.now().strftime('%d-%m-%Y'))}

Consulting Doctor: {report_data.get('doctorName', 'N/A')}

Please find your detailed medical report attached as a PDF file.

Important Notes:
- Keep this report for your medical records
- Follow the prescribed medications and recommendations
- Contact your doctor if you have any questions

Best regards,
{SENDER_NAME}

---
This is an automated email. Please do not reply to this message.
"""
        else:  # doctor
            body = f"""
Dear Dr. {recipient_name},

A copy of the medical report for your patient has been generated and is attached.

Patient Details:
- Name: {report_data.get('patientName', 'N/A')}
- Age: {report_data.get('age', 'N/A')}
- Gender: {report_data.get('gender', 'N/A')}
- Date: {report_data.get('dateOfConsultation', datetime.now().strftime('%d-%m-%Y'))}

This report has also been sent to the patient's email address.

Best regards,
{SENDER_NAME}

---
This is an automated email. Please do not reply to this message.
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        print(f"   Attaching PDF...")
        # Attach PDF
        pdf_buffer.seek(0)
        pdf_attachment = MIMEApplication(pdf_buffer.read(), _subtype='pdf')
        pdf_filename = f"Medical_Report_{report_data.get('patientName', 'Patient').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        pdf_attachment.add_header('Content-Disposition', 'attachment', filename=pdf_filename)
        msg.attach(pdf_attachment)
        
        print(f"   Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}...")
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            print(f"   Starting TLS...")
            server.starttls()
            print(f"   Logging in as {SENDER_EMAIL}...")
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            print(f"   Sending message...")
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {recipient_email} ({recipient_type})")
        
        return {
            'success': True,
            'message': f'Report sent to {recipient_email}'
        }
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP Authentication failed: {str(e)}"
        print(f"❌ {error_msg}")
        print("   Check your SMTP_EMAIL and SMTP_PASSWORD in .env file")
        print("   Make sure you're using an App Password, not your regular Gmail password")
        return {
            'success': False,
            'message': 'Email authentication failed. Check SMTP credentials in .env file.'
        }
    except Exception as e:
        error_msg = f"Error sending email: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        }


def send_report_to_both(patient_email, patient_name, doctor_email, doctor_name, pdf_buffer, report_data):
    """
    Send medical report to both patient and doctor
    
    Args:
        patient_email (str): Patient's email
        patient_name (str): Patient's name
        doctor_email (str): Doctor's email
        doctor_name (str): Doctor's name
        pdf_buffer (BytesIO): PDF file buffer
        report_data (dict): Report data
    
    Returns:
        dict: {success: bool, patient_sent: bool, doctor_sent: bool, messages: list}
    """
    
    results = {
        'success': False,
        'patient_sent': False,
        'doctor_sent': False,
        'messages': []
    }
    
    # Send to patient
    if patient_email:
        # Create a copy of the buffer for patient
        import io
        patient_buffer = io.BytesIO(pdf_buffer.getvalue())
        
        patient_result = send_report_email(
            patient_email,
            patient_name,
            patient_buffer,
            report_data,
            recipient_type='patient'
        )
        
        results['patient_sent'] = patient_result['success']
        results['messages'].append(f"Patient: {patient_result['message']}")
    else:
        results['messages'].append("Patient: No email address provided")
    
    # Send to doctor
    if doctor_email:
        # Create a copy of the buffer for doctor
        import io
        doctor_buffer = io.BytesIO(pdf_buffer.getvalue())
        
        doctor_result = send_report_email(
            doctor_email,
            doctor_name,
            doctor_buffer,
            report_data,
            recipient_type='doctor'
        )
        
        results['doctor_sent'] = doctor_result['success']
        results['messages'].append(f"Doctor: {doctor_result['message']}")
    else:
        results['messages'].append("Doctor: No email address provided")
    
    # Overall success if at least one email was sent
    results['success'] = results['patient_sent'] or results['doctor_sent']
    
    return results


def test_email_configuration():
    """
    Test if email service is properly configured
    
    Returns:
        dict: {configured: bool, message: str}
    """
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        return {
            'configured': False,
            'message': 'SMTP_EMAIL and SMTP_PASSWORD not set in .env file'
        }
    
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        return {
            'configured': True,
            'message': 'Email service configured correctly'
        }
    except Exception as e:
        return {
            'configured': False,
            'message': f'Email configuration error: {str(e)}'
        }
