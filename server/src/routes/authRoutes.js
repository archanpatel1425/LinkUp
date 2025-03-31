const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const multer = require('multer');

const upload = multer(); 

router.post('/signup',upload.none(), authController.signup);
router.post('/login', authController.login);
router.post('/validation', authController.extractDataFromToken);

module.exports = router;
