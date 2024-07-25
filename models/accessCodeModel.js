const mongoose = require('mongoose');

const accessCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: [true, 'An access code must have a code']
  },
  used: {
    type: Boolean,
    default: false
  }
  // expiresAt: Date
});

const AccessCode = mongoose.model('AccessCode', accessCodeSchema);

module.exports = AccessCode;
