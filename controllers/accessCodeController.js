// controllers/accessCodeController.js
const { v4: uuidv4 } = require('uuid');
const AccessCode = require('../models/accessCodeModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.generateAccessCode = catchAsync(async (req, res, next) => {
  const newCode = uuidv4();

  const accessCode = await AccessCode.create({
    code: newCode,
    // expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 1 week
  });

  res.status(201).json({
    status: 'success',
    data: {
      accessCode
    }
  });
});

exports.getAllAccessCodes = catchAsync(async (req, res, next) => {
  const accessCodes = await AccessCode.find();

  res.status(200).json({
    status: 'success',
    results: accessCodes.length,
    data: {
      accessCodes
    }
  });
});
