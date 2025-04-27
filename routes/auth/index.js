const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');

// Render the login page
router.get('/login', (req, res) => {
    res.render('auth/login');
});

// Login route
router.post('/login', AuthController.login);

// Logout route
router.post('/logout', AuthController.logout);

module.exports = router;