"""
Check Twilio SMS Delivery Status
Run this to see why SMS is not being delivered
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

# Load environment variables
load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')

# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

print("=" * 80)
print("TWILIO SMS DELIVERY STATUS CHECK")
print("=" * 80)

# Get the most recent message SID from logs
# You can replace this with the actual SID from your logs
message_sid = "SM28c9a7a4f9684b7c0dc9bb462353f306"  # Latest from logs

try:
    # Fetch message details
    message = client.messages(message_sid).fetch()
    
    print(f"\n📱 Message Details:")
    print(f"   SID: {message.sid}")
    print(f"   To: {message.to}")
    print(f"   From: {message.from_}")
    print(f"   Status: {message.status}")
    print(f"   Direction: {message.direction}")
    print(f"   Date Created: {message.date_created}")
    print(f"   Date Sent: {message.date_sent}")
    print(f"   Date Updated: {message.date_updated}")
    print(f"   Price: {message.price} {message.price_unit}")
    print(f"   Error Code: {message.error_code}")
    print(f"   Error Message: {message.error_message}")
    
    print(f"\n📝 Message Body:")
    print(f"   {message.body[:200]}...")
    
    print(f"\n🔍 Status Explanation:")
    status_info = {
        'queued': '⏳ Message is queued and waiting to be sent',
        'sending': '📤 Message is currently being sent',
        'sent': '✅ Message was sent successfully to carrier',
        'delivered': '✅✅ Message was delivered to recipient',
        'undelivered': '❌ Message failed to deliver',
        'failed': '❌ Message failed to send',
        'received': '📥 Message was received (for incoming)',
    }
    
    print(f"   {status_info.get(message.status, 'Unknown status')}")
    
    if message.error_code:
        print(f"\n❌ ERROR DETECTED:")
        print(f"   Code: {message.error_code}")
        print(f"   Message: {message.error_message}")
        print(f"\n   Check: https://www.twilio.com/docs/api/errors/{message.error_code}")
    
    if message.status == 'sent' and not message.error_code:
        print(f"\n✅ Message was sent successfully!")
        print(f"   If you haven't received it, possible reasons:")
        print(f"   1. Network delay (can take 1-5 minutes)")
        print(f"   2. Phone is off or out of coverage")
        print(f"   3. SMS blocked by carrier/phone settings")
        print(f"   4. Number format issue")
        print(f"   5. DND (Do Not Disturb) enabled on number")
    
    if message.status == 'delivered':
        print(f"\n✅✅ Message was DELIVERED!")
        print(f"   If you still haven't received it:")
        print(f"   1. Check spam/blocked messages folder")
        print(f"   2. Check if SMS app is working")
        print(f"   3. Try restarting your phone")
    
    # Get all recent messages
    print(f"\n\n📋 Recent Messages (Last 5):")
    print("=" * 80)
    
    messages = client.messages.list(limit=5)
    for msg in messages:
        status_emoji = {
            'delivered': '✅',
            'sent': '📤',
            'failed': '❌',
            'undelivered': '❌',
            'queued': '⏳'
        }.get(msg.status, '❓')
        
        print(f"{status_emoji} {msg.sid} | To: {msg.to} | Status: {msg.status} | {msg.date_created}")
        if msg.error_code:
            print(f"   ❌ Error {msg.error_code}: {msg.error_message}")

except Exception as e:
    print(f"\n❌ Error fetching message status: {e}")
    print(f"\nMake sure:")
    print(f"1. Twilio credentials are correct in .env")
    print(f"2. Message SID is valid")
    print(f"3. You have internet connection")

print("\n" + "=" * 80)
