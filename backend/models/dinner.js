const mongoose = require('mongoose');

const dinnerSchema = new mongoose.Schema({
    name: { type: String, required: true }, // name of the dish
    weekday: { type: String, required: true }, // Day of the week
    vegetarianOption: { type: Boolean, default: true }, // Whether a vegetarian option is available
    allergens: [String], 
    price: { type: Number, required: true }, // Price of the dish    
});

module.exports = mongoose.model('Dinner', dinnerSchema);
