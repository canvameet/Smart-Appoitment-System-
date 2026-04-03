"""
Simple WhatsApp Test
Tests if your number is connected to Twilio WhatsApp Sandbox
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

print("=" * 80)
print("WHATSAPP TEST - Sending Test Message")
print("=" * 80)

# Your phone number (clean, no spaces)
your_number = '+918734824104'
your_number_wa = f'whatsapp:{your_number}'

print(f"\n📱 Sending test message to: {your_number_wa}")
print(f"   From: {TWILIO_WHATSAPP_NUMBER}")

try:
    message = client.messages.create(
        body='🏥 *Test Message*\n\nHello! This is a test from your appointment system.\n\nIf you receive this, WhatsApp is working! ✅',
        from_=TWILIO_WHATSAPP_NUMBER,
        to=your_number_wa
    )
    
    print(f"\n✅ SUCCESS!")
    print(f"   Message SID: {message.sid}")
    print(f"   Status: {message.status}")
    print(f"\n📱 Check your WhatsApp now!")
    print(f"   You should receive a message from Twilio Sandbox")
    
except Exception as e:
    error_str = str(e)
    print(f"\n❌ FAILED: {error_str}")
    
    if '63007' in error_str or 'not currently' in error_str:
        print(f"\n⚠️  ERROR: Your number hasn't joined the WhatsApp Sandbox!")
        print(f"\n📱 TO FIX:")
        print(f"   1. Open WhatsApp on your phone")
        print(f"   2. Send a message to: +1 415 523 8886")
        print(f"   3. Message content: join <your-code>")
        print(f"\n   Get your code from:")
        print(f"   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn")
        print(f"\n   You'll see something like: 'join abc-def'")
        print(f"   Send that EXACT message to +1 415 523 8886")
        print(f"\n   Wait for confirmation, then run this test again!")
    
    elif '21211' in error_str or 'not a valid' in error_str:
        print(f"\n⚠️  ERROR: Phone number format issue")
        print(f"   Make sure number is: {your_number}")
        print(f"   No spaces, correct format")

print("\n" + "=" * 80)
