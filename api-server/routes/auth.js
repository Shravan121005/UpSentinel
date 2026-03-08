const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// POST /auth/signup
router.post('/signup', AuthController.signup);

// POST /auth/login
router.post('/login', AuthController.login);

module.exports = router;
