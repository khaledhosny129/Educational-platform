const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  url: String,
  youtubeCode: {
    type: String,
    required: [true, 'A video must have a YouTube code']
  },
  grade: {
    type: String,
    required: [true, 'A video must have a grade']
  },
  level: {
    type: String,
    required: [true, 'A video must have a level']
  },
  unit: {
    type: String,
    default: null // Unit is null for revision videos
  },
  revision: {
    type: String,
    default: null // Revision is null for normal videos
  },
  session: {
    type: String,
    required: [true, 'A video must have a session']
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
