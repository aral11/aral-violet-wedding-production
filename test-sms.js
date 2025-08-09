import twilio from 'twilio';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 SMS Service Test');
console.log('==================');

// Check environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('✅ Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'NOT SET');
console.log('✅ Auth Token:', authToken ? 'SET' : 'NOT SET');
console.log('✅ Phone Number:', fromNumber || 'NOT SET');

// Test Twilio client initialization
try {
  if (accountSid && authToken) {
    const client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
    
    // Test sending SMS to first notification number
    const testNumber = '+918105003858';
    const testMessage = '🧪 SMS Test - Wedding Website System Check\n\nThis is a test message to verify SMS functionality.\n\nTimestamp: ' + new Date().toLocaleString() + '\n\nA&V Wedding 💕';
    
    console.log(`📱 Attempting to send test SMS to ${testNumber}...`);
    
    const message = await client.messages.create({
      body: testMessage,
      from: fromNumber,
      to: testNumber
    });
    
    console.log('✅ Test SMS sent successfully!');
    console.log('📱 Message SID:', message.sid);
    console.log('📱 Status:', message.status);
    
  } else {
    console.log('❌ Missing Twilio credentials - cannot send actual SMS');
  }
} catch (error) {
  console.log('❌ SMS test failed:', error.message);
}

console.log('\n📋 SMS System Status: READY');
