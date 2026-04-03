/**
 * EmailJS Service - Send emails directly from frontend
 * No backend SMTP configuration needed!
 */
import emailjs from '@emailjs/browser';

// EmailJS Configuration (from .env)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Initialize EmailJS
 */
export const initEmailJS = () => {
  if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS initialized');
  } else {
    console.warn('⚠️ EmailJS not configured. Set VITE_EMAILJS_* variables in .env');
  }
};

/**
 * Send medical report via email
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {string} params.patientName - Patient name
 * @param {string} params.doctorName - Doctor name
 * @param {string} params.reportDate - Report date
 * @param {Object} params.reportData - Full report data object
 * @param {string} params.recipientType - 'patient' or 'doctor'
 * @returns {Promise<Object>} - {success: boolean, message: string}
 */
export const sendMedicalReportEmail = async ({
  toEmail,
  toName,
  patientName,
  doctorName,
  reportDate,
  reportData,
  recipientType = 'patient'
}) => {
  
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    return {
      success: false,
      message: 'EmailJS not configured. Please set up EmailJS credentials in .env file.'
    };
  }

  if (!toEmail) {
    return {
      success: false,
      message: `No email address provided for ${recipientType}`
    };
  }

  try {
    console.log(`📧 Sending email to ${toEmail} (${recipientType})...`);

    // Format symptoms
    const symptomsText = reportData.symptoms && reportData.symptoms.length > 0
      ? reportData.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'Not specified';

    // Format diagnosis
    const diagnosisText = reportData.diagnosis && reportData.diagnosis.length > 0
      ? reportData.diagnosis.map((d, i) => `${i + 1}. ${d}`).join('\n')
      : 'Not specified';

    // Format medicines
    let medicinesText = 'No medications prescribed';
    if (reportData.medicines && reportData.medicines.length > 0) {
      medicinesText = reportData.medicines.map((med, i) => 
        `${i + 1}. ${med.name}\n   Dosage: ${med.dosage}\n   Frequency: ${med.frequency}`
      ).join('\n\n');
    }

    // Format recommendations
    const recommendationsText = reportData.recommendations && reportData.recommendations.length > 0
      ? reportData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : 'No specific recommendations';

    // Format follow-up
    const followUpText = reportData.followUpInstructions || 'No follow-up required';

    // Format additional notes
    const notesText = reportData.additionalNotes || 'None';

    // Prepare email message based on recipient type
    let message = '';
    if (recipientType === 'patient') {
      message = `Dear ${toName},

Your medical consultation report is ready. Please find the details below:

═══════════════════════════════════════════════════
MEDICAL CONSULTATION REPORT
═══════════════════════════════════════════════════

PATIENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${reportData.patientName || patientName}
Age: ${reportData.age || 'N/A'}
Gender: ${reportData.gender || 'N/A'}
Date of Consultation: ${reportDate}
Consulting Doctor: ${doctorName}

SYMPTOMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${symptomsText}

DIAGNOSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${diagnosisText}

PRESCRIBED MEDICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${medicinesText}

RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendationsText}

FOLLOW-UP INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${followUpText}

ADDITIONAL NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${notesText}

═══════════════════════════════════════════════════

IMPORTANT NOTES:
• Keep this report for your medical records
• Follow the prescribed medications and recommendations
• Contact your doctor if you have any questions or concerns
• Do not self-medicate or change dosages without consulting your doctor

For any queries, please contact:
Smart Medical Center

Best regards,
${doctorName}
Smart Medical Center

---
This is an automated email. Please do not reply.`;
    } else {
      message = `Dear Dr. ${toName},

A medical report for your patient has been generated. Please find the details below:

═══════════════════════════════════════════════════
MEDICAL CONSULTATION REPORT
═══════════════════════════════════════════════════

PATIENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${reportData.patientName || patientName}
Age: ${reportData.age || 'N/A'}
Gender: ${reportData.gender || 'N/A'}
Date of Consultation: ${reportDate}

SYMPTOMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${symptomsText}

DIAGNOSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${diagnosisText}

PRESCRIBED MEDICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${medicinesText}

RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendationsText}

FOLLOW-UP INSTRUCTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${followUpText}

ADDITIONAL NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${notesText}

═══════════════════════════════════════════════════

This report has also been sent to the patient's email address.

Best regards,
Smart Medical Center

---
This is an automated email. Please do not reply.`;
    }

    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name: toName,
        patient_name: reportData.patientName || patientName,
        doctor_name: doctorName,
        report_date: reportDate,
        message: message,
        recipient_type: recipientType
      }
    );

    console.log(`✅ Email sent successfully to ${toEmail}`, response);

    return {
      success: true,
      message: `Email sent to ${toEmail}`
    };

  } catch (error) {
    console.error(`❌ Failed to send email to ${toEmail}:`, error);
    
    return {
      success: false,
      message: `Failed to send email: ${error.text || error.message || 'Unknown error'}`
    };
  }
};

/**
 * Send report to both patient and doctor
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} - {success: boolean, patientSent: boolean, doctorSent: boolean, messages: array}
 */
export const sendReportToBoth = async ({
  patientEmail,
  patientName,
  doctorEmail,
  doctorName,
  reportData
}) => {
  
  const results = {
    success: false,
    patientSent: false,
    doctorSent: false,
    messages: []
  };

  const reportDate = reportData.dateOfConsultation || new Date().toLocaleDateString();

  // Send to patient
  if (patientEmail) {
    const patientResult = await sendMedicalReportEmail({
      toEmail: patientEmail,
      toName: patientName,
      patientName: reportData.patientName || patientName,
      doctorName: reportData.doctorName || doctorName,
      reportDate: reportDate,
      reportData: reportData,
      recipientType: 'patient'
    });

    results.patientSent = patientResult.success;
    results.messages.push(`Patient: ${patientResult.message}`);
  } else {
    results.messages.push('Patient: No email address provided');
  }

  // Send to doctor
  if (doctorEmail) {
    const doctorResult = await sendMedicalReportEmail({
      toEmail: doctorEmail,
      toName: doctorName,
      patientName: reportData.patientName || patientName,
      doctorName: reportData.doctorName || doctorName,
      reportDate: reportDate,
      reportData: reportData,
      recipientType: 'doctor'
    });

    results.doctorSent = doctorResult.success;
    results.messages.push(`Doctor: ${doctorResult.message}`);
  } else {
    results.messages.push('Doctor: No email address provided');
  }

  // Overall success if at least one email was sent
  results.success = results.patientSent || results.doctorSent;

  return results;
};

/**
 * Test EmailJS configuration
 * @returns {Object} - {configured: boolean, message: string}
 */
export const testEmailJSConfig = () => {
  const configured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
  
  return {
    configured,
    message: configured 
      ? 'EmailJS is configured correctly' 
      : 'EmailJS not configured. Please set VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in frontend/.env'
  };
};
