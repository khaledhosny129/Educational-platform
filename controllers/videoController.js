const Video = require('../models/videoModel');
const AccessCode = require('../models/accessCodeModel');
const Activation = require('../models/activationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, unit, session } = req.params;

  const newVideo = await Video.create({
    title: `${grade} ${level} Unit ${unit} Session ${session}`,
    description: `${grade} ${level} Unit ${unit} Session ${session}`,
    url: `https://www.youtube.com/watch?v=${youtubeCode}`,
    youtubeCode,
    grade,
    level,
    unit,
    session
  });

  res.status(201).json({
    status: 'success',
    data: {
      video: newVideo
    }
  });
});

exports.getAllVideos = catchAsync(async (req, res, next) => {
  const videos = await Video.find();
  res.status(200).json({
    status: 'success',
    results: videos.length,
    data: {
      videos
    }
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const { grade, level, unit, session } = req.params;
  const userId = req.user.id;

  const video = await Video.findOne({ grade, level, unit, session });

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
  const { grade, level, unit, session } = req.params;

  const video = await Video.findOneAndUpdate(
    { grade, level, unit, session },
    {
      title: `${grade} ${level} Unit ${unit} Session ${session}`,
      description: `${grade} ${level} Unit ${unit} Session ${session}`,
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
  const { grade, level, unit, session } = req.params;
  const video = await Video.findOneAndDelete({ grade, level, unit, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.activateVideo = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { grade, level, unit, session } = req.params;
  const userId = req.user.id;

  const video = await Video.findOne({ grade, level, unit, session });

  const accessCode = await AccessCode.findOne({ code });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  if (!accessCode || accessCode.expiresAt < Date.now() || accessCode.used) {
    return next(new AppError('Invalid or expired access code', 400));
  }

  // Check if the video is already activated by the user
  const existingActivation = await Activation.findOne({
    video: req.params.id,
    user: req.user._id
  });

  if (existingActivation) {
    return next(new AppError('Video is already activated by this user', 400));
  }

  const activation = await Activation.create({
    video: video._id,
    user: userId,
    code: accessCode._id
  });

  // Mark access code as used
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
  const { grade, level, unit, session } = req.params;
  const userId = req.user.id;

  // Find the video
  const video = await Video.findOne({ grade, level, unit, session });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  // Find the activation for the video by this user
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
