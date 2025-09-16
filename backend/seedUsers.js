const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Room = require('./models/room');

const MONGO = 'mongodb://localhost:27017/moroccan_friends_house';

async function seed() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to Mongo for user seeding');

  // Ensure there's at least one room to attach hostelId
  let room = await Room.findOne();
  if (!room) {
    room = await Room.create({ name: 'Seed Hostel', capacity: 10, type: 'Hostel', price: 0, amenities: [], availibility: true });
    console.log('Created seed room with id', room._id);
  }

  // Clear existing users (dangerous: only for local test)
  await User.deleteMany();

  const managerPassword = 'ManagerPass123!';
  const volunteerPassword = 'VolunteerPass123!';

  const manager = new User({
    name: 'Manager One',
    email: 'manager@example.com',
    passwordHash: await bcrypt.hash(managerPassword, 10),
    role: 'manager',
    status: 'active',
    hostelId: room._id
  });

  const volunteerActive = new User({
    name: 'Volunteer Active',
    email: 'volunteer.active@example.com',
    passwordHash: await bcrypt.hash(volunteerPassword, 10),
    role: 'volunteer',
    status: 'active',
    hostelId: room._id
  });

  const volunteerPending = new User({
    name: 'Volunteer Pending',
    email: 'volunteer.pending@example.com',
    passwordHash: await bcrypt.hash(volunteerPassword, 10),
    role: 'volunteer',
    status: 'pending',
    hostelId: room._id
  });

  await manager.save();
  await volunteerActive.save();
  await volunteerPending.save();

  console.log('Seed users created:');
  console.log('Manager -> email: manager@example.com password:', managerPassword);
  console.log('Active Volunteer -> email: volunteer.active@example.com password:', volunteerPassword);
  console.log('Pending Volunteer -> email: volunteer.pending@example.com password:', volunteerPassword);

  await mongoose.connection.close();
  console.log('User seeding complete');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
