/* eslint-disable import/no-extraneous-dependencies */
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { type } = require('os');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide your phone number'],
    validate: {
      validator: function(val) {
        return validator.isMobilePhone(val, 'ar-EG');
      },
      message: 'Please provide a valid Egyptian phone number'
    }
  },
  parentPhoneNumber: {
    type: String,
    validate: {
      validator: function(val) {
        return validator.isMobilePhone(val, 'ar-EG');
      },
      message: 'Please provide a valid Egyptian phone number'
    }
  },
  schoolName: {
    type: String,
    required: [true, 'Please provide your school name']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  deviceId: {
    type: String,
    default: null
  },
  passwordChangedAt: Date,
  passwordResetCode: String,
  passwordResetExpires: Date,
  // confirmEmailToken: String,
  active: {
    type: Boolean,
    default: true
  }
  // confirmEmail: {
  //   type: Boolean,
  //   default: false
  // }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.virtual('farms', {
  ref: 'Farm',
  foreignField: 'user',
  localField: '_id'
});

// userSchema.pre(/^find/, function (next) {
//   // this points to the current query
//   this.find({ active: { $ne: false } });
//   next();
// });

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetCode = function() {
  // Generate a random 4-6 digit number
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Store the hashed version of the code in the database
  this.passwordResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  // Set expiration time to 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetCode; // Send plain code to the user
};

userSchema.methods.createConfirmEmailToken = function() {
  const confirmToken = crypto.randomBytes(32).toString('hex');

  this.confirmEmailToken = confirmToken;

  // console.log({ confirmToken }, this.confirmEmailToken);

  return confirmToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
