const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/AuthController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

router.get('/login', (req, res) => {
    res.render('auth/login');
});

router.post('/login', AuthController.login);

router.get('/profile', isAuthenticated, (req, res) => {
    res.render('auth/profile');
});

module.exports = router;