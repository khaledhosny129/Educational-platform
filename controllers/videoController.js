const Video = require('../models/videoModel');
const AccessCode = require('../models/accessCodeModel');
const Activation = require('../models/activationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, revision, session } = req.params;

  // Determine if it's a revision video or a normal video
  const videoData = {
    title: `${grade} ${level} ${revision ? `Revision ${revision}` : `Unit ${req.params.unit}`} Session ${session}`,
    description: `${grade} ${level} ${revision ? `Revision ${revision}` : `Unit ${req.params.unit}`} Session ${session}`,
    url: `https://www.youtube.com/watch?v=${youtubeCode}`,
    youtubeCode,
    grade,
    level,
    session
  };

  if (revision) {
    videoData.revision = revision;
  } else {
    videoData.unit = req.params.unit || null;
  }

  const newVideo = await Video.create(videoData);

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
  const { grade, level, revision, session } = req.params;
  const userId = req.user.id;

  const query = { grade, level, session };
  if (revision) {
    query.revision = revision;
  } else {
    query.unit = req.params.unit || null;
  }

  const video = await Video.findOne(query);

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
  const { grade, level, revision, session } = req.params;

  const updateData = {
    title: `${grade} ${level} ${revision ? `Revision ${revision}` : `Unit ${req.params.unit}`} Session ${session}`,
    description: `${grade} ${level} ${revision ? `Revision ${revision}` : `Unit ${req.params.unit}`} Session ${session}`,
    url: `https://www.youtube.com/watch?v=${youtubeCode}`,
    youtubeCode
  };

  if (revision) {
    updateData.revision = revision;
  } else {
    updateData.unit = req.params.unit || null;
  }

  const video = await Video.findOneAndUpdate(
    { grade, level, session, ...(revision ? { revision } : { unit: req.params.unit || null }) },
    updateData,
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
  const { grade, level, revision, session } = req.params;

  const query = { grade, level, session };
  if (revision) {
    query.revision = revision;
  } else {
    query.unit = req.params.unit || null;
  }

  const video = await Video.findOneAndDelete(query);

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
  const { grade, level, revision, session } = req.params;
  const userId = req.user.id;

  const query = { grade, level, session };
  if (revision) {
    query.revision = revision;
  } else {
    query.unit = req.params.unit || null;
  }

  const video = await Video.findOne(query);
  const accessCode = await AccessCode.findOne({ code });

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  if (!accessCode || accessCode.expiresAt < Date.now() || accessCode.used) {
    return next(new AppError('Invalid or expired access code', 400));
  }

  // Check if the video is already activated by the user
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
  const { grade, level, revision, session } = req.params;
  const userId = req.user.id;

  const query = { grade, level, session };
  if (revision) {
    query.revision = revision;
  } else {
    query.unit = req.params.unit || null;
  }

  // Find the video
  const video = await Video.findOne(query);

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
