const mongoose = require ('mongoose');
const Room = require('./models/room');

const rooms = [
    {name: 'Room 1', capacity: 2, type: 'Private', price: 20, amenities: ['WIFI', 'TOWEL', 'TERRACE'], availibility: true },
    {name: 'Room 2', capacity: 2, type: 'private', price: 20, amenities: ['WIFI', 'AC', 'TOWELS', 'TERRACE'], availibility: true },
    {name: 'Room 3', capacity: 1, type: 'private', price: 17, amenities: ['WIFI', 'TOWEL', 'TERRACE'], availibility: true},
];

mongoose.connect('mongodb://localhost:27017/moroccan_friends_house')
    .then(async () => {
        console.log('connected to mongodb');
        await Room.deleteMany();
        await Room.insertMany(rooms);
        console.log('data added successfully!');
        mongoose.connection.close();
    })

    .catch((err) => {
        console.error('error seeding room data:', err);
    });