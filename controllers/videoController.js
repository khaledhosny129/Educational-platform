const Video = require('../models/videoModel');
const AccessCode = require('../models/accessCodeModel');
const Activation = require('../models/activationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;

  const newVideo = await Video.create({
    title: revision
      ? `${grade} ${level} Revision ${revision} Session ${session}`
      : `${grade} ${level} Unit ${unit} Session ${session}`,
    description: revision
      ? `${grade} ${level} Revision ${revision} Session ${session}`
      : `${grade} ${level} Unit ${unit} Session ${session}`,
    url: `https://www.youtube.com/watch?v=${youtubeCode}`,
    youtubeCode,
    grade,
    level,
    unit,
    revision,
    session
  });

  res.status(201).json({
    status: 'success',
    data: {
      video: newVideo
    }
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;
  const userId = req.user.id;

  const video = await Video.findOne({ grade, level, unit, revision, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  const activation = await Activation.findOne({
    video: video._id,
    user: userId
  });

  if (!activation || new Date() > activation.expiresAt) {
    return next(
      new AppError('You do not have an active activation for this video', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      video
    }
  });
});

exports.updateVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;

  const video = await Video.findOneAndUpdate(
    { grade, level, unit, revision, session },
    {
      title: revision
        ? `${grade} ${level} Revision ${revision} Session ${session}`
        : `${grade} ${level} Unit ${unit} Session ${session}`,
      description: revision
        ? `${grade} ${level} Revision ${revision} Session ${session}`
        : `${grade} ${level} Unit ${unit} Session ${session}`,
      url: `https://www.youtube.com/watch?v=${youtubeCode}`,
      youtubeCode
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      video
    }
  });
});

exports.deleteVideo = catchAsync(async (req, res, next) => {
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;

  const video = await Video.findOneAndDelete({ grade, level, unit, revision, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Activation and deactivation methods
exports.activateVideo = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;
  const userId = req.user.id;

  const video = await Video.findOne({ grade, level, unit, revision, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  const accessCode = await AccessCode.findOne({ code });

  if (!accessCode || accessCode.expiresAt < Date.now() || accessCode.used) {
    return next(new AppError('Invalid or expired access code', 400));
  }

  const existingActivation = await Activation.findOne({
    video: video._id,
    user: userId
  });

  if (existingActivation) {
    return next(new AppError('Video is already activated by this user', 400));
  }

  const activation = await Activation.create({
    video: video._id,
    user: userId,
    code: accessCode._id
  });

  accessCode.used = true;
  await accessCode.save();

  res.status(200).json({
    status: 'success',
    data: {
      activation
    }
  });
});

exports.deactivateVideo = catchAsync(async (req, res, next) => {
  const { grade, level, session } = req.params;
  const unit = req.params.unit || null;
  const revision = req.params.revision || null;
  const userId = req.user.id;

  const video = await Video.findOne({ grade, level, unit, revision, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  const activation = await Activation.findOneAndDelete({
    video: video._id,
    user: userId
  });

  if (!activation) {
    return next(new AppError('No active activation found for this video', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Video deactivated successfully'
  });
});

exports.getActivatedVideos = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const activations = await Activation.find({ user: userId })
    .populate('video')
    .populate('code');

  res.status(200).json({
    status: 'success',
    results: activations.length,
    data: {
      activations
    }
  });
});
