// File path: /home/monsif/Desktop/Moroccan-friends-house/backend/models/room.js

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
	name: {type: String, required: true },
	capacity: {type: Number, required: true },
	type: {type: String, required: true },
	price: {type: Number, required: true },
	amenities: [String],
	availibility: {type: Boolean, default: true },
	});

module.exports = mongoose.model('room', roomSchema);
