// Load environment variables at the beginning
require('dotenv').config();

console.log('SERVER.JS STARTED');

const express = require('express');
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const Booking = require ('./models/bookings.js');
const Dinner = require('./models/dinner.js');
// JWT Authentication
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "super-secret-key";
const bcrypt = require('bcrypt');
const User = require('./models/user');
const ACCESS_TOKEN_EXP = '15m';
const REFRESH_TOKEN_EXP = '7d';

// SendGrid for confirmation link
const { sendEmail } = require('./services/email-sender');


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

// For backwards compatibility keep existing behavior when no users exist


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
        // Normalize check-in/check-out to UTC day boundaries
        const inUTC = new Date(checkIn);
        inUTC.setUTCHours(0, 0, 0, 0);
        const outUTC = new Date(checkOut);
        outUTC.setUTCHours(23, 59, 59, 999);

        // Check for overlapping bookings for this room
        const overlapping = await Booking.findOne({
            room,
            checkInDate: { $lt: outUTC },
            checkOutDate: { $gt: inUTC }
        });

        if (overlapping) {
            return res.status(409).json({ error: 'Room is already booked for these dates.' });
        }
        // Create and save the booking using UTC-normalized dates
        const booking = new Booking({
            user: { name, email, phone },
            room,
            checkInDate: inUTC,
            checkOutDate: outUTC,
            persons,
            status: 'confirmed'
        });

        // Save booking
        await booking.save();

        // Generate a view token (magic link) for the guest
        const viewToken = jwt.sign({ bookingId: booking._id }, SECRET_KEY, { expiresIn: '24h' });
        const link = `https://yourapp.com/reservations/view?token=${viewToken}`;

        // Send confirmation email asynchronously with sandbox mode
        console.log('Attempting to send booking confirmation email...');
        try {
          await sendEmail({
            to: email,
            subject: 'Your Booking Confirmation',
            html: `<p>Thanks for booking! <a href=\"${link}\">View My Reservation</a></p>`,
            sandbox: true // Enable sandbox mode for testing
          });
          console.log('Email processed successfully');
        } catch (err) {
          console.error('Failed to send booking email:', err);
        }

        // Return response to client
        return res.status(201).json({ message: 'Booking successful', booking });
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

// New auth endpoints
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Only active users can login
    if (user.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const payload = { id: user._id, role: user.role, hostelId: user.hostelId };
        const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXP });
        const refreshToken = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXP });

        // Store refresh token server-side for revocation
        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        await user.save();

        // Return tokens. In production set refresh token as HttpOnly cookie.
        return res.json({ accessToken, refreshToken, user: { id: user._id, role: user.role, hostelId: user.hostelId } });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Public registration endpoint - creates a pending volunteer
app.post('/auth/register', async (req, res) => {
    const { name, email, password, hostelId } = req.body;
    if (!email || !password || !hostelId) return res.status(400).json({ error: 'Missing fields' });
    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already registered' });
        const hash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, passwordHash: hash, hostelId, role: 'volunteer', status: 'pending' });
        await user.save();
        // Notify manager via email or leave for manager UI to pick up
        return res.status(201).json({ message: 'Registration successful. Awaiting manager approval.' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Manager endpoints to list and approve/cancel pending accounts
app.get('/auth/pending', async (req, res) => {
    // require manager authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
        const pending = await User.find({ status: 'pending', hostelId: decoded.hostelId }).select('-passwordHash -refreshTokens');
        return res.json({ pending });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/auth/pending/:id/approve', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.hostelId.toString() !== decoded.hostelId.toString()) return res.status(403).json({ error: 'Not your hostel' });
        user.status = 'active';
        await user.save();
        return res.json({ message: 'User approved' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

app.post('/auth/pending/:id/cancel', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.hostelId.toString() !== decoded.hostelId.toString()) return res.status(403).json({ error: 'Not your hostel' });
        user.status = 'cancelled';
        await user.save();
        return res.json({ message: 'User cancelled' });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

app.post('/auth/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });

    try {
        const decoded = jwt.verify(refreshToken, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'Invalid refresh token' });
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) return res.status(401).json({ error: 'Refresh token revoked' });

        // rotate refresh token
        const newRefresh = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXP });
        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
        user.refreshTokens.push(newRefresh);
        await user.save();

        const payload = { id: user._id, role: user.role, hostelId: user.hostelId };
        const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXP });
        return res.json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

app.post('/auth/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
    try {
        const decoded = jwt.verify(refreshToken, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (user) {
            user.refreshTokens = (user.refreshTokens || []).filter(t => t !== refreshToken);
            await user.save();
        }
        return res.json({ message: 'Logged out' });
    } catch (err) {
        return res.status(400).json({ error: 'Invalid refresh token' });
    }
});

// GET current user
app.get('/auth/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ user });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
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
                
                // Find booking first to inspect hostel and current status
                const booking = await Booking.findById(id).populate('room', 'name hostelId');
                if (!booking) {
                    console.log('Booking not found with id:', id);
                    return res.status(404).json({ error: 'Booking not found' });
                }

                // Authorization: managers can do everything; volunteers limited
                if (user.role !== 'manager') {
                    // If user is volunteer, restrict allowed status transitions
                    const allowedForVolunteer = ['checked-in', 'checked-out', 'no-show'];
                    if (user.role === 'volunteer') {
                        if (!allowedForVolunteer.includes(status)) {
                            return res.status(403).json({ error: 'Volunteers cannot set this status.' });
                        }
                    } else {
                        // other roles forbidden by default
                        return res.status(403).json({ error: 'Forbidden.' });
                    }
                }

                // Update the booking after authorization
                booking.status = status;
                await booking.save();
                
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


// PUT endpoint to update any booking (admin only)
app.put('/dashboard/bookings/:id', async (req, res) => {
  // Authenticate and authorize
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  if (tokenBlacklist.has(token)) return res.status(403).json({ error: 'Token invalidated.' });

  jwt.verify(token, SECRET_KEY, async (err, user) => {
    if (err || user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    const { id } = req.params;
    const updates = req.body;
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid booking ID.' });
      }
      const booking = await Booking.findByIdAndUpdate(id, updates, { new: true }).populate('room', 'name');
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      res.json(booking);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// DELETE endpoint to remove a booking (admin only)
app.delete('/dashboard/bookings/:id', async (req, res) => {
  // Authenticate and authorize
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  if (tokenBlacklist.has(token)) return res.status(403).json({ error: 'Token invalidated.' });

  jwt.verify(token, SECRET_KEY, async (err, user) => {
    if (err || user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    const { id } = req.params;
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid booking ID.' });
      }
      const booking = await Booking.findByIdAndDelete(id);
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      res.json({ message: 'Booking deleted successfully.' });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});