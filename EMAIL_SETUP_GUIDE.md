# 📧 Email Service Setup Guide

## Overview
The system can automatically email PDF medical reports to both patients and doctors using Gmail SMTP (100% FREE).

## Setup Steps

### 1. **Create/Use Gmail Account**
- Use your existing Gmail account OR create a new one for the hospital
- Example: `smartmedicalcenter@gmail.com`

### 2. **Enable 2-Step Verification**
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process

### 3. **Generate App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter name: "Smart Medical System"
4. Click "Generate"
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 4. **Update .env File**
Add these lines to your `.env` file:

```env
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
HOSPITAL_NAME=Smart Medical Center
```

**Important**: Remove spaces from the app password!

### 5. **Test Configuration**
Run the Flask backend and the system will automatically test email configuration on startup.

## How It Works

### When Doctor Generates PDF Report:

1. **Doctor clicks "Download PDF"**
2. **System asks**: "Do you want to email this report?"
   - Click **OK** → PDF downloaded + Emails sent to patient & doctor
   - Click **Cancel** → PDF downloaded only

3. **Email sent to**:
   - **Patient**: Email from their signup account
   - **Doctor**: Email from their signup account

### Email Content:

**To Patient:**
```
Subject: Medical Report - [Patient Name]

Dear [Patient Name],

Your medical consultation report is ready and attached.

Patient Details:
- Name: John Doe
- Age: 35
- Gender: Male
- Date: 04-04-2026

Consulting Doctor: Dr. Meet Ratwani

Please find your detailed medical report attached as a PDF file.

Best regards,
Smart Medical Center
```

**To Doctor:**
```
Subject: Medical Report - [Patient Name]

Dear Dr. [Doctor Name],

A copy of the medical report for your patient has been generated.

Patient Details:
- Name: John Doe
- Age: 35
- Gender: Male
- Date: 04-04-2026

This report has also been sent to the patient's email address.

Best regards,
Smart Medical Center
```

## Features

✅ **FREE** - Uses Gmail SMTP (no cost)
✅ **Automatic** - Emails sent when generating PDF
✅ **Dual Delivery** - Both patient and doctor receive copies
✅ **Professional** - Formatted email with PDF attachment
✅ **Secure** - Uses app-specific password (not your main password)
✅ **Optional** - Doctor can choose to skip emailing

## Troubleshooting

### "Email authentication failed"
- Check that 2-Step Verification is enabled
- Regenerate app password
- Remove spaces from password in .env file

### "SMTP_EMAIL not set"
- Make sure .env file has SMTP_EMAIL and SMTP_PASSWORD
- Restart Flask backend after updating .env

### Emails not received
- Check spam/junk folder
- Verify email addresses are correct in Firebase
- Check Gmail account hasn't hit daily sending limit (500 emails/day)

## Gmail Limits

- **Daily limit**: 500 emails per day
- **Per minute**: ~20 emails
- **Attachment size**: 25 MB (our PDFs are typically < 1 MB)

## Security Notes

- ✅ App password is separate from your main Gmail password
- ✅ Can be revoked anytime from Google Account settings
- ✅ Only has permission to send emails
- ✅ Cannot access your inbox or other Google services

## Alternative Email Providers

If you prefer not to use Gmail, you can use:
- **Outlook/Hotmail**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **Custom SMTP**: Update `email_service.py` with your SMTP server

Just update the SMTP_SERVER and SMTP_PORT in `email_service.py`.

## Cost

**$0.00** - Completely FREE using Gmail SMTP!
