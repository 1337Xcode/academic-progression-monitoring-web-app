const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');

// Login route
router.get('/login', (req, res) => {
    res.render('auth/login');
});

router.post('/login', AuthController.login);

// Logout route
router.post('/logout', AuthController.logout);

module.exports = router;