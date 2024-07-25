// routes/accessCodeRoutes.js
const express = require('express');
const accessCodeController = require('../controllers/accessCodeController');

const router = express.Router();

router.post('/generate', accessCodeController.generateAccessCode);
router.get('/', accessCodeController.getAllAccessCodes);

module.exports = router;
