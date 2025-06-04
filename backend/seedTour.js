const mongoose = require ('mongoose');

const Tour = require('./models/tours');

const tours = [
    {name: 'Camel Ride', description: 'Ride the Camel', price: 20, availibility: true},
    {name: 'Horse Ride', description: 'Ride the Camel', price: 20, availibility: true},

]


mongoose.connect('mongodb://localhost:27017/moroccan_friends_house')
    .then(async () => {
        console.log('connected to MongoDB successfully');
        await Tour.deleteMany();
        await Tour.insertMany(tours);
        console.log('tours seeded successfully');
        mongoose.connection.close();
    })

    .catch((err) => {
        console.error('error seeding tours ', err);
    });