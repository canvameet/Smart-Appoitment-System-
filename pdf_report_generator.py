"""
Medical Report PDF Generator
Uses ReportLab (free, open-source) to generate professional medical reports
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from datetime import datetime
import os
import io

def generate_medical_report(report_data, hospital_settings, output_path=None):
    """
    Generate a professional medical report PDF
    
    Args:
        report_data (dict): Patient and consultation data
            - patientName
            - age
            - gender
            - dateOfConsultation
            - symptoms (list or string)
            - diagnosis (list or string)
            - medicines (list of dicts with name, dosage, frequency)
            - recommendations (list or string)
            - followUpInstructions
            - additionalNotes
            - doctorName
        hospital_settings (dict): Hospital configuration
            - hospitalName
            - address
            - contactNumber
            - email
            - logoUrl (optional)
            - footerText
        output_path (str): Path to save PDF. If None, returns BytesIO buffer
    
    Returns:
        str or BytesIO: File path or buffer containing PDF
    """
    
    # Create buffer or file
    if output_path:
        buffer = output_path
    else:
        buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=1.5*inch,
        bottomMargin=1*inch
    )
    
    # Container for PDF elements
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=6,
        leading=16
    )
    
    # Title
    title = Paragraph("MEDICAL APPOINTMENT SUMMARY", title_style)
    elements.append(title)
    
    # Date and Time subtitle
    from datetime import datetime
    current_datetime = datetime.now().strftime('%d %B %Y, %I:%M %p')
    date_time_text = f"Generated on: {current_datetime}"
    date_time = Paragraph(date_time_text, subtitle_style)
    elements.append(date_time)
    elements.append(Spacer(1, 0.2*inch))
    
    # Patient Information Table
    patient_data = [
        ['Patient Name:', report_data.get('patientName', 'N/A'), 'Age:', report_data.get('age', 'N/A')],
        ['Gender:', report_data.get('gender', 'N/A'), 'Date:', report_data.get('dateOfConsultation', datetime.now().strftime('%d-%m-%Y'))]
    ]
    
    patient_table = Table(patient_data, colWidths=[1.5*inch, 2.5*inch, 1*inch, 1.5*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e0e7ff')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    
    elements.append(patient_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Symptoms Section
    elements.append(Paragraph("SYMPTOMS", heading_style))
    symptoms = report_data.get('symptoms', [])
    if isinstance(symptoms, str):
        symptoms = [symptoms]
    for symptom in symptoms:
        elements.append(Paragraph(f"• {symptom}", normal_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Diagnosis Section
    elements.append(Paragraph("DIAGNOSIS", heading_style))
    diagnosis = report_data.get('diagnosis', [])
    if isinstance(diagnosis, str):
        diagnosis = [diagnosis]
    for diag in diagnosis:
        elements.append(Paragraph(f"• {diag}", normal_style))
    elements.append(Spacer(1, 0.15*inch))
    
    # Medicines Section
    medicines = report_data.get('medicines', [])
    if medicines:
        elements.append(Paragraph("PRESCRIBED MEDICINES", heading_style))
        
        if isinstance(medicines, list) and len(medicines) > 0:
            med_data = [['Medicine', 'Dosage', 'Frequency']]
            for med in medicines:
                if isinstance(med, dict):
                    med_data.append([
                        med.get('name', 'N/A'),
                        med.get('dosage', 'N/A'),
                        med.get('frequency', 'N/A')
                    ])
                else:
                    med_data.append([str(med), '-', '-'])
            
            med_table = Table(med_data, colWidths=[2.5*inch, 1.5*inch, 2.5*inch])
            med_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8)
            ]))
            
            elements.append(med_table)
        else:
            elements.append(Paragraph("No medicines prescribed", normal_style))
        
        elements.append(Spacer(1, 0.15*inch))
    
    # Recommendations Section
    recommendations = report_data.get('recommendations', [])
    if recommendations:
        elements.append(Paragraph("RECOMMENDATIONS", heading_style))
        if isinstance(recommendations, str):
            recommendations = [recommendations]
        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", normal_style))
        elements.append(Spacer(1, 0.15*inch))
    
    # Follow-up Instructions
    followup = report_data.get('followUpInstructions', '')
    if followup:
        elements.append(Paragraph("FOLLOW-UP INSTRUCTIONS", heading_style))
        elements.append(Paragraph(followup, normal_style))
        elements.append(Spacer(1, 0.15*inch))
    
    # Additional Notes
    notes = report_data.get('additionalNotes', '')
    if notes:
        elements.append(Paragraph("ADDITIONAL NOTES", heading_style))
        elements.append(Paragraph(notes, normal_style))
        elements.append(Spacer(1, 0.15*inch))
    
    # Doctor Information
    elements.append(Spacer(1, 0.3*inch))
    doctor_style = ParagraphStyle(
        'DoctorStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#1e40af'),
        fontName='Helvetica-Bold'
    )
    elements.append(Paragraph(f"Consulting Doctor: {report_data.get('doctorName', 'N/A')}", doctor_style))
    
    # Build PDF with custom header and footer
    def add_header_footer(canvas, doc):
        canvas.saveState()
        
        # Header
        canvas.setFillColor(colors.HexColor('#1e40af'))
        canvas.rect(0, A4[1] - 1.2*inch, A4[0], 1.2*inch, fill=True, stroke=False)
        
        # Logo (if provided)
        logo_url = hospital_settings.get('logoUrl', '')
        if logo_url and logo_url.strip():
            try:
                # Note: Logo loading from URL requires additional setup
                # For now, we'll skip logo rendering to avoid errors
                pass
            except Exception as e:
                print(f"⚠️  Could not load logo: {e}")
        
        # Hospital Name
        canvas.setFillColor(colors.white)
        canvas.setFont('Helvetica-Bold', 18)
        canvas.drawCentredString(A4[0]/2, A4[1] - 0.5*inch, hospital_settings.get('hospitalName', 'Medical Center'))
        
        # Address and Contact
        canvas.setFont('Helvetica', 10)
        canvas.drawCentredString(A4[0]/2, A4[1] - 0.75*inch, hospital_settings.get('address', ''))
        
        contact_line = f"Contact: {hospital_settings.get('contactNumber', '')}"
        if hospital_settings.get('email'):
            contact_line += f" | Email: {hospital_settings.get('email', '')}"
        if hospital_settings.get('website'):
            contact_line += f" | Web: {hospital_settings.get('website', '')}"
        canvas.drawCentredString(A4[0]/2, A4[1] - 0.95*inch, contact_line)
        
        # Footer
        canvas.setFillColor(colors.grey)
        canvas.setFont('Helvetica-Oblique', 9)
        footer_text = hospital_settings.get('footerText', 'Powered by Smart Management System')
        canvas.drawCentredString(A4[0]/2, 0.5*inch, footer_text)
        
        # Page number
        canvas.setFont('Helvetica', 9)
        canvas.drawRightString(A4[0] - 0.75*inch, 0.5*inch, f"Page {doc.page}")
        
        canvas.restoreState()
    
    # Build PDF
    doc.build(elements, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    
    if output_path:
        print(f"✅ PDF report generated: {output_path}")
        return output_path
    else:
        buffer.seek(0)
        return buffer


def parse_consultation_transcript(transcript, language='English'):
    """
    Parse consultation transcript using Groq AI and extract structured data
    
    Args:
        transcript (str): Raw consultation text
        language (str): Language preference
    
    Returns:
        dict: Structured report data
    """
    try:
        import os
        from groq import Groq
        
        # Initialize Groq client
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            print("⚠️  GROQ_API_KEY not found in environment")
            return _get_template_report(transcript)
        
        client = Groq(api_key=api_key)
        
        # Create prompt for medical report extraction
        prompt = f"""You are a professional medical AI assistant. Extract structured information from this doctor-patient consultation transcript and format it as a medical report.

The consultation is in {language}. Extract information and return the report in the SAME language ({language}).

Consultation Transcript:
{transcript}

Extract and return ONLY a JSON object with these fields (no additional text):
{{
    "patientName": "extracted patient name or 'Not mentioned'",
    "age": "extracted age or 'N/A'",
    "gender": "Male/Female/Other or 'N/A'",
    "symptoms": ["list of symptoms mentioned"],
    "diagnosis": ["list of diagnoses or conditions identified"],
    "medicines": [
        {{"name": "medicine name", "dosage": "dosage", "frequency": "frequency"}}
    ],
    "recommendations": ["list of doctor's recommendations"],
    "followUpInstructions": "follow-up instructions as a single string",
    "additionalNotes": "any allergies, medical history, or important notes"
}}

IMPORTANT:
- All text in the JSON should be in {language}
- Be concise and professional
- Extract only factual information from the transcript
- If information is not mentioned, use "Not mentioned" or "N/A" in {language}
- Maintain medical terminology accuracy"""

        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Fast and accurate
            messages=[
                {"role": "system", "content": "You are a medical report extraction AI. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # Parse response
        result_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response (in case there's extra text)
        import json
        import re
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            result_text = json_match.group(0)
        
        extracted_data = json.loads(result_text)
        
        # Add current date if not present
        extracted_data['dateOfConsultation'] = datetime.now().strftime('%d-%m-%Y')
        
        # Ensure all required fields exist
        required_fields = ['patientName', 'age', 'gender', 'symptoms', 'diagnosis', 
                          'medicines', 'recommendations', 'followUpInstructions', 'additionalNotes']
        for field in required_fields:
            if field not in extracted_data:
                if field in ['symptoms', 'diagnosis', 'recommendations', 'medicines']:
                    extracted_data[field] = []
                else:
                    extracted_data[field] = 'N/A'
        
        print(f"✅ Successfully parsed consultation transcript using Groq AI")
        return extracted_data
        
    except Exception as e:
        print(f"❌ Error parsing transcript with AI: {e}")
        import traceback
        traceback.print_exc()
        return _get_template_report(transcript)


def _get_template_report(transcript):
    """Fallback template when AI parsing fails"""
    return {
        'patientName': 'To be extracted',
        'age': 'N/A',
        'gender': 'N/A',
        'dateOfConsultation': datetime.now().strftime('%d-%m-%Y'),
        'symptoms': ['To be extracted from transcript'],
        'diagnosis': ['To be determined'],
        'medicines': [],
        'recommendations': ['To be determined'],
        'followUpInstructions': 'To be determined',
        'additionalNotes': transcript[:500] + '...' if len(transcript) > 500 else transcript,
        'doctorName': 'To be assigned'
    }
