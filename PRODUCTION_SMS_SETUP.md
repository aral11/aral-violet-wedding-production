# 🚀 Production SMS Setup for Wedding Website

## Current Status

✅ SMS functionality is now implemented with real Twilio integration
✅ Server-side code is production-ready  
⚠️ **Requires Twilio account configuration to send actual SMS**

## Phone Numbers That Will Receive SMS

When someone submits an RSVP, SMS notifications will be sent to:

- `+918105003858`
- `+917276700997`
- `+919731832609`

## Quick Setup Guide

### Step 1: Create Twilio Account (FREE)

1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a **free account**
3. Complete phone number verification
4. **Free Trial**: $15 credit (covers ~2000 SMS messages!)

### Step 2: Get Your Credentials

1. Go to [Twilio Console](https://console.twilio.com)
2. Copy these values from your dashboard:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (click eye icon to reveal)

### Step 3: Get a Phone Number

1. In Twilio Console: **Phone Numbers** → **Manage** → **Buy a number**
2. Choose any number (free trial includes one number)
3. Copy the number (format: `+1234567890`)

### Step 4: Configure Environment Variables

**For your hosting platform**, set these environment variables:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Note**: These are server environment variables (not client-side `VITE_` variables)

### Step 5: Deploy and Test

1. **Deploy** your updated code to your hosting platform
2. **Test SMS**: Go to `/debug` page and click "Test SMS Service"
3. **Submit RSVP**: Submit a test RSVP to verify SMS notifications work

## Example SMS Message

When someone submits an RSVP, family members will receive:

```
🎉 NEW RSVP RECEIVED!

👤 Name: John Doe
📧 Email: john@example.com
📱 Phone: +1234567890
✅ Will Attend
👥 Guests: 2
👨‍👩‍👧‍👦 Side: Aral's side

💬 Message: So excited to celebrate!
🍽️ Dietary: Vegetarian

TheVIRALWedding - A&V 💕
```

## Cost Information

- **Free Trial**: $15 credit (~2000 SMS to India)
- **SMS Cost**: ~$0.0075 per message to Indian numbers
- **Monthly Cost**: ~$1/month for phone number (after trial)

**Total estimated cost for wedding**: Under $5 for ~100 RSVPs!

## Platform-Specific Setup

### GitHub Pages + Netlify Functions

If you're using GitHub Pages with Netlify Functions:

1. Create `netlify/functions/sms.js`
2. Set environment variables in Netlify dashboard
3. Update client code to call Netlify function URL

### Vercel

If deploying on Vercel:

1. Set environment variables in Vercel dashboard
2. Functions will work automatically

### Railway/Heroku/Fly.io

If using Node.js hosting:

1. Set environment variables in hosting dashboard
2. Deploy with `npm install twilio` in production

## Testing

### Development Mode (No SMS Sent)

- Website works normally
- SMS messages logged to server console
- Perfect for testing RSVP functionality

### Production Mode (Real SMS Sent)

- Requires Twilio credentials
- Actual SMS sent to family phone numbers
- Perfect for live wedding website

## Current Implementation

✅ **Ready Features**:

- Real-time RSVP notifications to family
- Complete RSVP details in SMS
- Error handling and retry logic
- Development/production modes
- Test SMS functionality

**Just need**: Twilio account + 3 environment variables = Live SMS! 📱
