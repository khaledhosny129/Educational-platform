const express = require('express');
const videoController = require('../controllers/videoController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// Normal video routes (with unit)
router
  .route('/:grade/:level/u:unit/:session')
  .post(authController.restrictTo('admin'), videoController.uploadVideo)
  .get(videoController.getVideo)
  .patch(authController.restrictTo('admin'), videoController.updateVideo)
  .delete(authController.restrictTo('admin'), videoController.deleteVideo);

// Revision video routes (without unit)
router
  .route('/:grade/:level/r:revision/:session')
  .post(authController.restrictTo('admin'), videoController.uploadVideo)
  .get(videoController.getVideo)
  .patch(authController.restrictTo('admin'), videoController.updateVideo)
  .delete(authController.restrictTo('admin'), videoController.deleteVideo);

// Activate video
router
  .route('/:grade/:level/u:unit/:session/activate')
  .post(videoController.activateVideo);

router
  .route('/:grade/:level/r:revision/:session/activate')
  .post(videoController.activateVideo);

// Deactivate video
router
  .route('/:grade/:level/u:unit/:session/deactivate')
  .post(videoController.deactivateVideo);

router
  .route('/:grade/:level/r:revision/:session/deactivate')
  .post(videoController.deactivateVideo);

// Get activated videos for a user
router.route('/activations').get(videoController.getActivatedVideos);

module.exports = router;
