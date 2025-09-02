// backend/send-email.js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid API key
// Make sure dotenv is loaded before accessing environment variables
try {
  require('dotenv').config();
} catch (err) {
  console.log('Dotenv not available, using environment variables directly');
}

const apiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(apiKey);

// Warn if API key missing or invalid
if (!apiKey) {
  console.error('Error: SENDGRID_API_KEY is not set in environment. Emails will not be sent.');
} else if (!apiKey.startsWith('SG.')) {
  console.warn('Warning: SENDGRID_API_KEY does not start with "SG.". This may not be a valid SendGrid API key.');
}

/**
 * Send an email via SendGrid.
 * @param {object} params
 * @param {string} params.to       Recipient email address
 * @param {string} params.subject  Email subject
 * @param {string} params.html     HTML content
 * @param {boolean} [params.sandbox=false]  Enable sandbox mode (no real send)
 */
async function sendEmail({ to, subject, html, sandbox = false }) {
  const msg = {
    to,
    from: 'no-reply@moroccan-friends-house.com',  // Replace with your verified sender domain
    subject,
    html,
  };
  // Enable sandbox mode per email if requested
  if (sandbox) {
    msg.mailSettings = { sandboxMode: { enable: true } };
  }
  // Log the email payload for debugging
  console.log('SendGrid payload:', JSON.stringify(msg, null, 2));
  
  try {
    const result = await sgMail.send(msg);
    console.log('SendGrid API response:', result);
    return result;
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('Error body:', error.response.body);
    }
    throw error;
  }
}

module.exports = { sendEmail };