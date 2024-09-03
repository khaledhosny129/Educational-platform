const mongoose = require('mongoose');

const activationSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.ObjectId,
    ref: 'Video',
    required: [true, 'An activation must belong to a video']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'An activation must belong to a user']
  },
  code: {
    type: mongoose.Schema.ObjectId,
    ref: 'AccessCode',
    required: [true, 'An activation must have an access code']
  },
  activatedAt: {
    type: Date,
    default: Date.now,
    required: [true, 'An activation must have an activation date']
  },
  expiresAt: {
    type: Date,
    index: { expires: '1s' }
  }
});

activationSchema.pre('save', function(next) {
  // Set expiry 1 week from activation
  this.expiresAt = new Date(
    this.activatedAt.getTime() + 7 * 24 * 60 * 60 * 1000
    // this.activatedAt.getTime() + 1 * 60 * 1000  Set expiry 1 minute from activation
  );
  next();
});

const Activation = mongoose.model('Activation', activationSchema);

module.exports = Activation;
