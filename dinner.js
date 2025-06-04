/* file path: /home/monsif/Desktop/Moroccan-friends-house/backend/models/dinner.js*/

const mongoose = require('mongoose');



const dinnerSchema = new mongoose.Schema({
    name: { type: String, required: true}, //name of the dish
    weekday: {type: String, required: true}, //Day of the week
    vegetarianOption: {type: Boolean, default: true}, // Wether a vegetarian option is available
    lergens : [String],
    price: { type: Number, required: true}, //Price of the dish    
});

module.exports = mongoose.model('Dinner', dinnerSchema);



