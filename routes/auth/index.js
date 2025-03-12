const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

// Login route
router.get('/login', (req, res) => {
    res.render('auth/login');
});

router.post('/login', AuthController.login);

// Logout route
router.post('/logout', AuthController.logout);

router.get('/profile', isAuthenticated, (req, res) => {
    res.render('student/profile');
});

module.exports = router;