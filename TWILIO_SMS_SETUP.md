# 📱 SMS Notifications Setup for Wedding Website

## Overview

Your wedding website now supports SMS notifications to family members whenever someone submits an RSVP!

**Note**: SMS functionality has been implemented server-side to avoid browser compatibility issues. The client-side code now calls server API endpoints for SMS operations.

## Notification Recipients

SMS notifications will be sent to:

- `+918105003858`
- `+917276700997`
- `+919731832609`

## Setup Instructions

### Step 1: Create Twilio Account

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Complete phone verification

### Step 2: Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com)
2. From your dashboard, copy:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click the eye icon to reveal)

### Step 3: Get Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number (free trial gives you one number)
3. Copy the phone number (format: `+1234567890`)

### Step 4: Configure Environment Variables

**Current Status**: SMS functionality is implemented but requires server-side Twilio configuration in production.

For development, the system logs SMS messages to the console instead of sending actual SMS.

**For production deployment**, you would need to:

1. Set up server environment variables (not client-side):

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

2. Install Twilio on the server:

```bash
npm install twilio
```

3. Update the server SMS service to use actual Twilio instead of console logging.

### Step 5: Test SMS Notifications

After configuring, test the system:

1. Go to your website debug page: `/debug`
2. Check console logs when submitting an RSVP
3. Verify SMS messages are sent to the family phone numbers

## SMS Message Format

When an RSVP is submitted, family members receive:

```
🎉 NEW RSVP RECEIVED!

👤 Name: John Doe
📧 Email: john@example.com
📱 Phone: +1234567890
✅ Will Attend
👥 Guests: 2
👨‍👩‍👧‍👦 Side: Aral's side

💬 Message: So excited to celebrate with you!
🍽️ Dietary: Vegetarian
🏨 Needs Accommodation: Yes

TheVIRALWedding - A&V 💕
```

## Cost Information

- **Free Trial**: $15 credit (approximately 500+ SMS messages)
- **SMS Cost**: ~$0.0075 per message to Indian numbers
- **Phone Number**: ~$1/month (after trial)

## Security Notes

- ✅ Auth token is kept secure in environment variables
- ✅ SMS service fails gracefully - RSVP still works if SMS fails
- ✅ Phone numbers are not exposed in client code
- ✅ SMS is optional - website works without it

## Troubleshooting

### SMS Not Sending?

1. Check server console logs for SMS notification attempts
2. Verify API endpoints are responding (`/api/sms/test`)
3. Check browser network tab for API call failures
4. Server logs will show the SMS message content that would be sent

### Development vs Production:

- **Development**: SMS messages are logged to server console only
- **Production**: Would require actual Twilio configuration on server

### API Issues?

- Check browser dev tools → Network tab for `/api/sms/` calls
- Server console shows detailed SMS notification logs
- Test SMS functionality via `/debug` page

## Benefits

✅ **Instant Notifications**: Family gets notified immediately when someone RSVPs
✅ **Complete Details**: All RSVP information included in message
✅ **Reliable**: Uses professional Twilio service
✅ **Optional**: Website works perfectly without SMS configured
✅ **Secure**: No sensitive data exposed to users
