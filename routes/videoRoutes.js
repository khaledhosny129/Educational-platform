const express = require('express');
const videoController = require('../controllers/videoController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/:grade/:level/:unit/:session')
  .post(authController.restrictTo('admin'), videoController.uploadVideo)
  .get(videoController.getVideo)
  .patch(authController.restrictTo('admin'), videoController.updateVideo)
  .delete(authController.restrictTo('admin'), videoController.deleteVideo);

router
  .route('/:grade/:level/:unit/:session/activate')
  .post(videoController.activateVideo);

router
  .route('/:grade/:level/:unit/:session/deactivate')
  .post(videoController.deactivateVideo);

router.route('/').get(videoController.getAllVideos);

router.route('/activated').get(videoController.getActivatedVideos);

module.exports = router;
