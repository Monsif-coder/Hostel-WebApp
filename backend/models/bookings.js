// filepath: /home/monsif/Desktop/Moroccan-friends-house/backend/models/bookings


const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
	user: {
	name: {type: String, required: true},
	email: { type: String, required: true},
	},

	room: { type: mongoose.Schema. Types. ObjectId, ref: 'room', required: true },
	checkInDate: { type: Date, required: true},
	checkIndate: { type: Date, required: true},
	status: { type: String, default: 'confirmed' },
});

module.exports = mongoose.model('Booking', bookingSchema);

