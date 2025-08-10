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
        res.status(201).json({ message: 'Booking successful ', booking });
    } catch (err) {
        res.status(500).json({ error: 'Error creating booking: ' + err.message });
    }
});

/*app.post('/bookings', async (req, res) => {
    const { user, room, checkIn, checkOut, persons } = req.body;
    let missingFields = [];

    // Check for required fields
    if (!user) {
        missingFields.push('user');
    } else {
        if (!user.name) missingFields.push('user.name');
        if (!user.email) missingFields.push('user.email');
    }
    if (!room) missingFields.push('room');
    if (!checkIn) missingFields.push('checkIn');
    if (!checkOut) missingFields.push('checkOut');
    if (!persons) missingFields.push('persons');

    // If any required field is missing, send a 400 response listing them
    if (missingFields.length > 0) {
        return res
            .status(400)
            .json({ error: 'Missing required fields: ' + missingFields.join(', ') });
    }

    // Continue processing if all required fields are present
    try {
        const booking = new Booking({
            user,
            room,
            checkInDate: new Date(checkIn),
            checkOutDate: new Date(checkOut),
            persons,
            status: 'confirmed'
        });

        await booking.save();

        // Populate the room field with the actual room name before sending the response
        await booking.populate('room', 'name');
        res.status(201).json({ message: 'Booking successful', booking });
    } catch (err) {
        res.status(500).json({ error: 'Error creating booking: ' + err.message });
    }
});*/
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

// Endpoint to fetch all bookings
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching bookings: ' + err.message });
    }
});


// Import MongoDB client to connect to the database

const { client } = require('./database.js')

// Establish connection to the database

async function connectToDatabase() {
    if (!client.isConnected || !client.topology || !client.topology.isConnected()) {
        await client.connect();
        console.log('Connected to MongoDB via native driver');
    } 

    // Return the specific database we use

    return client.db('moroccan_friends_house');

}

// Create a new endpoint for the dashboard to fetch booking data

app.get('/dashboard/bookings', async (req, res) => {
    try {

        // Connect to the database using our finction
        // const db = await connectToDatabase();

        //Access the 'bookings' collection and query for all documents:
        //the find() method returns a cursor; we call toArray to retrieve all documents as an array.

        const bookings = await Booking.find().populate('room', 'name');

        // send the booking data back to the client as JSON format 

        res.json(bookings);

    } catch (err) {
        // if an error occurs, we catch it and notify the end user it's a server issue
        res.status(500).json({ error: 'Failed to fetch bookings:' + err.message });
    }
})

// Srtart the server
app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
});