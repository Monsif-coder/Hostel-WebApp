/* file path: /home/monsif/Desktop/Moroccan-friends-house/backend/models/tours.js*/

const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
	name: {type: String, required: true},
	price: {type: Number, required: true},
	Description: {String},
	availibility: {Boolean},

})


module.exports = mongoose.model('Tour', tourSchema);