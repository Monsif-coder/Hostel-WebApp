// filepath: /home/monsif/Desktop/Moroccan-friends-house/backend/server.js


const express = require('express');
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const Booking = require ('./models/bookings.js');
const Dinner = require('./models/dinner.js');
// JWT Authentication
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "super-secret-key";

// Token blacklist (in-memory for development)
// In production, use Redis or another fast database
const tokenBlacklist = new Set();

// Clean up expired tokens from blacklist every hour
setInterval(() => {
    const initialSize = tokenBlacklist.size;
    const tokensToRemove = [];
    
    // Identify expired tokens
    tokenBlacklist.forEach(token => {
        try {
            jwt.verify(token, SECRET_KEY);
        } catch (err) {
            // Token is expired or invalid, safe to remove
            tokensToRemove.push(token);
        }
    });
    
    // Remove expired tokens
    tokensToRemove.forEach(token => {
        tokenBlacklist.delete(token);
    });
    
    if (initialSize !== tokenBlacklist.size) {
        console.log(`Blacklist cleanup: removed ${initialSize - tokenBlacklist.size} expired tokens. Current size: ${tokenBlacklist.size}`);
    }
}, 3600000); // Run every hour


const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

console.log('SERVER.JS STARTED');

// Hardcoded data for testing

const user = {
    id: 1,
    username: 'manager',
  password: 'password123', // Use hash passwords in prod
  role: 'manager',

};


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


// LOGIN Endpoint for JWT authentication

app.post('/login', (req, res) => {

    const { username, password } = req.body;

    // Verify that credentials match the dummy user 

    if ( username === user.username && password === user.password) {

            // Create a payload with user information
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
          };


          // Sign the token with the SECRET_KEY and set an expiration date
          const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m'});     
          
          // Return the token to the client
          return res.json({ token });

    } else {
        // Authentication failed
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});




// Protect the /dashboard/bookings endpoint with the authenticateToken middleware
app.get('/dashboard/bookings', async (req, res) => {
    try {
        const authHeader = req.headers['authorization']; // Extract the Authorization header
        const token = authHeader && authHeader.split(' ')[1]; // Extract token from 'Bearer <token>'

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        // Check if token is in blacklist
        if (tokenBlacklist.has(token)) {
            return res.status(403).json({ error: 'Token has been invalidated. Please log in again.' });
        }

        jwt.verify(token, SECRET_KEY, async (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired token.' });
            }
            req.user = user; // Attach the decoded user payload to the request object

            const bookings = await Booking.find().populate('room', 'name');
            res.json(bookings);
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings: ' + err.message });
    }
})


// PUT endpoint to update booking status - improved with better debug logging
app.put('/bookings/:id/status', async (req, res) => {
    console.log(`PUT /bookings/${req.params.id}/status route hit`);
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers);
    
    try {
        // Extract authentication header
        const authHeader = req.headers['authorization']; 
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            console.log('Token is blacklisted');
            return res.status(403).json({ error: 'Token has been invalidated.' });
        }
        
        // Verify the token
        jwt.verify(token, SECRET_KEY, async (err, user) => {
            if (err) {
                console.log('Token verification failed:', err.message);
                return res.status(403).json({ error: 'Invalid or expired token.' });
            }
            
            const { id } = req.params;
            const { status } = req.body;
            
            console.log(`Updating booking ${id} status to: ${status}`);
            
            // Validate status
            const validStatuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'];
            if (!validStatuses.includes(status)) {
                console.log('Invalid status:', status);
                return res.status(400).json({ error: 'Invalid status value' });
            }
            
            try {
                // Ensure id is a valid MongoDB ObjectId
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    console.log('Invalid MongoDB ObjectId:', id);
                    return res.status(400).json({ error: 'Invalid booking ID format' });
                }
                
                // Find and update the booking
                const booking = await Booking.findByIdAndUpdate(
                    id,
                    { status: status },
                    { new: true } // Return the updated document
                ).populate('room', 'name');
                
                if (!booking) {
                    console.log('Booking not found with id:', id);
                    return res.status(404).json({ error: 'Booking not found' });
                }
                
                console.log(`Booking updated successfully: ${booking._id}`);
                return res.json(booking);
            } catch (dbErr) {
                console.error('Database error:', dbErr);
                return res.status(500).json({ error: 'Database error: ' + dbErr.message });
            }
        });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({ error: 'Error updating booking status: ' + err.message });
    }
});

// Logout endpoint - invalidates the token by adding it to the blacklist
app.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(400).json({ message: 'Token not provided' });
    }
    
    // Add token to blacklist
    tokenBlacklist.add(token);
    
    console.log(`Token added to blacklist. Blacklist size: ${tokenBlacklist.size}`);
    return res.status(200).json({ message: 'Logged out successfully' });
});


// Start the server
app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
});