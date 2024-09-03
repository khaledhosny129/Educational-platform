const Video = require('../models/videoModel');
const AccessCode = require('../models/accessCodeModel');
const Activation = require('../models/activationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Function to generate video details
const generateVideoDetails = (grade, level, unit, session, num) => {
  const isRevision = !!num;
  const title = isRevision
    ? `${grade} ${level} Revision ${num}`
    : `${grade} ${level} Unit ${unit} Session ${session}`;
  const description = isRevision
    ? `Revision video for ${grade} ${level}, Revision ${num}`
    : `Video for ${grade} ${level}, Unit ${unit}, Session ${session}`;
  return { title, description, isRevision };
};

// Upload a new video
exports.uploadVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, unit, session, num } = req.params;

  const { title, description, isRevision } = generateVideoDetails(
    grade,
    level,
    unit,
    session,
    num
  );

  const newVideo = await Video.create({
    title,
    description,
    url: `https://www.youtube.com/watch?v=${youtubeCode}`,
    youtubeCode,
    grade,
    level,
    unit: isRevision ? 'revision' : unit,
    session: isRevision ? null : session,
    revision: isRevision ? num : undefined
  });

  res.status(201).json({
    status: 'success',
    data: {
      video: newVideo
    }
  });
});

// Get all videos
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

// Get a specific video
exports.getVideo = catchAsync(async (req, res, next) => {
  const { grade, level, unit, session, num } = req.params;
  const userId = req.user.id;

  const query = {
    grade,
    level,
    unit: unit === 'revision' ? 'revision' : unit,
    session: unit === 'revision' ? null : session,
    revision: num || undefined
  };

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

// Update a video
exports.updateVideo = catchAsync(async (req, res, next) => {
  const { youtubeCode } = req.body;
  const { grade, level, unit, session, num } = req.params;

  const { title, description, isRevision } = generateVideoDetails(
    grade,
    level,
    unit,
    session,
    num
  );

  const query = {
    grade,
    level,
    unit: isRevision ? 'revision' : unit,
    session: isRevision ? null : session,
    revision: isRevision ? num : undefined
  };

  const video = await Video.findOneAndUpdate(
    query,
    {
      title,
      description,
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

// Delete a video
exports.deleteVideo = catchAsync(async (req, res, next) => {
  const { grade, level, unit, session, num } = req.params;

  const query = {
    grade,
    level,
    unit: unit === 'revision' ? 'revision' : unit,
    session: unit === 'revision' ? null : session,
    revision: num || undefined
  };

  const video = await Video.findOneAndDelete(query);

  if (!video) {
    return next(new AppError('No video found with the specified details', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Activate a video
exports.activateVideo = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const { grade, level, unit, session, num } = req.params;
  const userId = req.user.id;

  const query = {
    grade,
    level,
    unit: unit === 'revision' ? 'revision' : unit,
    session: unit === 'revision' ? null : session,
    revision: num || undefined
  };

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

// Deactivate a video
exports.deactivateVideo = catchAsync(async (req, res, next) => {
  const { grade, level, unit, session, num } = req.params;
  const userId = req.user.id;

  const query = {
    grade,
    level,
    unit: unit === 'revision' ? 'revision' : unit,
    session: unit === 'revision' ? null : session,
    revision: num || undefined
  };

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

// Get all activated videos for a user
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
