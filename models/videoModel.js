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
  },
  session: {
    type: String,
  },
  revision: {
    type: Number, // For revision videos
  }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
