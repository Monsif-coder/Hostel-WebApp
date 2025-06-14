// filepath: /home/monsif/Desktop/Moroccan-friends-house/backend/models/bookings


const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
	user: {
		name: { type: String, required: true },
		email: { type: String, required: true },
		phone: String
	},
	room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
	checkInDate: { type: Date, required: true },
	checkOutDate: { type: Date, required: true },
	persons: { type: Number, required: true },
	status: { type: String, default: 'confirmed' }
});

module.exports = mongoose.model('Booking', bookingSchema);

