// test-email.js - Simple script to test SendGrid email functionality
require('dotenv').config();
const { sendEmail } = require('./backend/services/email-sender');

console.log('Starting email test...');
console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY);
console.log('SendGrid API Key starts with:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY.substring(0, 7) + '...' : 'N/A');

async function testEmail() {
  try {
    console.log('Attempting to send test email...');
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email from Moroccan Friends House',
      html: '<h1>This is a test email</h1><p>This email was sent from the testing script with sandbox mode enabled.</p>',
      sandbox: true // Enable sandbox mode to prevent actual email delivery
    });
    
    console.log('Email test completed successfully!');
    console.log('Response:', result);
    return result;
  } catch (error) {
    console.error('Failed to send test email:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
    throw error;
  }
}

// Run the test
testEmail()
  .then(() => console.log('Test completed!'))
  .catch(err => console.error('Test failed with error:', err));
