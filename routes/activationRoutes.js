const express = require('express');
const activationController = require('../controllers/activationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/validate', activationController.validateAccess);
router.get(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  activationController.getAllActivations
);

module.exports = router;
