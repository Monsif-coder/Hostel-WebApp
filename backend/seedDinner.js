const mongoose = require('mongoose');
const Dinner = require('./models/dinner');

const dinner_options = [
    {name: 'Chicken Tagine', weekday: 'Monday', vegetarianOption: true, allergens: ['nuts'], price: 30 },
    {name:'Kefta Tagine', weekday: 'Tuesday', vegetarianOption: true, allergens: ['gluten'], price: 40 },
    {name: 'Fish Tagine', weekday: 'Wednesday', vegetarianOption: true, allergens: ['gluten'], price: 30 },
    {name: 'Seffa', weekday: 'Thursday', vegetarianOption: true, allergens: ['Cinnamon'], price: 40 },
    {name: 'Couscous', weekday: 'Friday', vegetarianOption: false, allergens: ['gluten'], price: 30 },
    {name: 'Barbecue', weekday: 'Saturday', vegetarianOption: false, allergens: ['gluten'], price: 50 },
    {name: 'French Rice', weekday: 'Sunday', vegetarianOption: true, allergens: ['gluten'], price: 30 },
];


mongoose 

    .connect('mongodb://localhost:27017/moroccan_friends_house', {
        useNewUrlParser: true,
        useUnifiedTopology: true,

    })
    .then(async () => {
        console.log('Connected to MongoDB');
        await Dinner.deleteMany(); // Clear existing data
        await Dinner.insertMany(dinner_options); // Insert new data
        console.log('Dinner data seeded successfully!');
        mongoose.connection.close(); 

    })

    .catch((err) => {
        console.error('Error seeding dinner data: ', err);
    });



