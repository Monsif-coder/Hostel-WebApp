// filepath: /home/monsif/Desktop/Moroccan-friends-house/backend/server.js


const express = require('express');
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const Booking = require ('./models/bookings.js');
const Dinner = require('./models/dinner.js');



const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

console.log('SERVER.JS STARTED');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/moroccan_friends_house', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
})
.then(() => {
        console.log('Connected to MongoDB');
}
)
.catch((err) => { 
        console.error('MongoDB connection error:', err);
}
);
// Root route
app.get('/', (req, res) => {
        res.send('Welcome to Moroccan Friends House API');

    });


// Handling cors errors

const cors = require('cors');
app.use(cors());
    
// Endpoint /available-rooms 

app.post('/available-rooms', async (req, res) => {
    try {
        const { checkIn, checkOut, persons } = req.body;
        // Find rooms with enough capacity
        const candidateRooms = await Room.find({ capacity: { $gte: Number(persons) } });
        // Find bookings that overlap with the requested dates
        const bookings = await Booking.find({
            $or: [
                { checkInDate: { $lt: new Date(checkOut) }, checkOutDate: { $gt: new Date(checkIn) } }
            ]
        });
        // Get Booked rooms Ids
        const bookedRoomIds = bookings.map(b => b.room.toString());
        // Filter out booked rooms
        const availableRooms = candidateRooms.filter(room => !bookedRoomIds.includes(room._id.toString()));
        res.json(availableRooms);
    } catch (err) {
        res.status(500).send('Error finding available rooms: ' + err.message);
    }
})



// Recieve and save booking data

app.post('/bookings', async (req, res) => {
    console.log('POST /bookings route hit');
    console.log('Request body:', req.body);

    try {
        const { name, email, phone, room, checkIn, checkOut, persons } = req.body;

        if (!name || !email || !room || !checkIn || !checkOut || !persons) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Check for overlapping bookings for this room
        const overlapping = await Booking.findOne({
            room,
            checkInDate: { $lt: new Date(checkOut) },
            checkOutDate: { $gt: new Date(checkIn) }
        });

        if (overlapping) {
            return res.status(409).json({ error: 'Room is already booked for these dates.' });
        }

        // Create and save the booking
        const booking = new Booking({
            user: { name, email, phone },
            room,
            checkInDate: new Date(checkIn),
            checkOutDate: new Date(checkOut),
            persons,
            status: 'confirmed'
        });

        await booking.save();
        res.status(201).json({ message: 'Booking successful!', booking });
    } catch (err) {
        res.status(500).json({ error: 'Error creating booking: ' + err.message });
    }
});


// Test for getting all rooms in MongoDB

app.get('/rooms', async (req, res) => {
        try {
                const rooms = await Room.find();
                res.json(rooms);
                

        } catch (err) {
                res.status(500).send('Error fetching rooms: ' + err.message);
        }
});



// Route to get the dinner of the day

app.get('/dinner', async (req, res) => {
        try{
                const today = new Date().toLocaleDateString('en-US', {weekday: 'long'}); // Get current day of the week
                const dinner = await Dinner.findOne({weekday: today }) // find the dinner for today

                if (!dinner) {
                        return res.status(404).send('No dinner is scheduled for today. Our chef is on strike :(');
                }

                res.json(dinner); // send the dinner details as JSON

        } catch (err) {
                res.status(500).send('Error fetching dinner: ' + err.message);
        }
});

// Tour Route

const Tour = require('./models/tours.js');

app.get('/tours', async (req, res) => {
    try {
        const tours = await Tour.find();
        res.json(tours);
    } catch (err) {
        res.status(500).send('Error fetching tours: ' + err.message);
    }
});
        // Srtart the server
        app.listen(PORT, () => {
                console.log(`Server is running on http://localhost:${PORT}`);
        });