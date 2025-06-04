// filepath: /home/monsif/Desktop/Moroccan-friends-house/backend/server.js

const room = require('./models/room');
const booking = require ('/models/booking');

// Test MongoDB connection by creating a room

app.get('/test', async (req, res) => {
	try {
		const room = new room ({
		 name: 'Sunny Room',
		 type: 'double'
		 price: 120,
		 amenities: ['WIFI', 'AC', 'Terrace'],
	});
	await room.save();
	res.send('room created successfully!');
	} catch(err) {
	  res.status(500).send('Error creating room: ' + err.message);
		
	}

        });

