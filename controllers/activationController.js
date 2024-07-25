const Activation = require('../models/activationModel');
const AccessCode = require('../models/accessCodeModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.validateAccess = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  // Find the access code
  const accessCode = await AccessCode.findOne({ code });

  // if (!accessCode || accessCode.expiresAt < Date.now() || accessCode.used) {
  //   return next(new AppError('Invalid or expired access code', 400));
  // }

  if (!accessCode) {
    return next(new AppError('Access code not found', 400));
  }

  // Find the activation related to the access code
  const activation = await Activation.findOne({ code: accessCode._id })
    .populate('video')
    .populate('user')
    .populate('code');

  if (!activation) {
    return next(new AppError('Activation not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      video: activation.video,
      user: activation.user,
      code: activation.code
    }
  });
});

exports.getAllActivations = catchAsync(async (req, res, next) => {
  const activations = await Activation.find()
    .populate('video')
    .populate('user')
    .populate('code');

  res.status(200).json({
    status: 'success',
    results: activations.length,
    data: {
      activations
    }
  });
});
