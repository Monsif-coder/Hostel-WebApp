// test-booking-endpoint.js - Script to test the booking endpoint with email confirmation
require('dotenv').config();
const axios = require('axios');

// Test booking data
const testBooking = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  room: '68af894a00163745536b1ba5', // Room 1
  // Use a date far in the future to avoid conflicts
  checkIn: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
  checkOut: new Date(Date.now() + 31 * 86400000).toISOString(), // 31 days from now
  persons: 2
};

console.log('Starting booking endpoint test...');
console.log('Test data:', testBooking);

async function testBookingEndpoint() {
  try {
    console.log('Sending POST request to /bookings endpoint...');
    const response = await axios.post('http://localhost:5000/bookings', testBooking);
    
    console.log('Booking endpoint test completed successfully!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to test booking endpoint:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testBookingEndpoint()
  .then(() => console.log('Booking test completed!'))
  .catch(err => console.error('Booking test failed with error:', err));
