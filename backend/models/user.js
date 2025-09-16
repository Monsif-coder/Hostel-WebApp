const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['manager','volunteer','owner','admin'], default: 'volunteer' },
  permissions: [String],
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  refreshTokens: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
