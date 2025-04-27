const { User } = require('../models'); // Keep for potential use elsewhere, but login now uses API
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Ensure node-fetch is installed
const dotenv = require('dotenv');
const { badRequest } = require('../middlewares/errorMiddleware');
const apiClient = require('../utils/apiClient'); // Import the API client

// Load environment variables from .env file
dotenv.config();


// Login function to authenticate users and create a session
exports.login = async (req, res, next) => {
    const { username, password, recaptchaResponse } = req.body;

    if (!recaptchaResponse) { // Check if reCAPTCHA response is provided
        console.error("No reCAPTCHA token provided.");
        return badRequest(req, res, next, 'Captcha token is missing.');
    }

    // Verify the reCAPTCHA token with Google's API
    // Reference: https://developers.google.com/recaptcha/docs/v3
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(recaptchaResponse)}`
        });

        const verificationData = await verificationResponse.json();

        // Check that the verification was successful
        if (!verificationData.success || verificationData.score < 0.5 || verificationData.action !== 'LOGIN') {
            console.error("Captcha verification failed:", verificationData);
            return badRequest(req, res, next, 'Failed captcha submission. Return to Homepage.');
        }
    } catch (error) {
        console.error("Error during captcha verification:", error);
        res.status(500);
        return next(error);
    }

    // Proceed with authentication via API client
    try {
        // Find the user via API client
        const user = await apiClient.get('/users', { username: username }); // API returns full user object

        // Verify password using bcrypt
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.render('auth/login', { error: 'Invalid username or password' });
        }

        // Create JWT token with expiration time of 1 hour
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        req.session.token = token;
        req.session.userId = user.user_id;
        req.session.role = user.role;

        // Redirect based on user role
        if (user.role === 'STUDENT') {
            res.redirect('/student/dashboard');
        } else if (user.role === 'ADMIN') {
            res.redirect('/admin/dashboard');
        } else {
            res.status(403).send('Invalid role');
        }

    } catch (error) {
        console.error('Login error:', error);
        if (error.status === 404) { // Handle 'User not found' from API
            return res.render('auth/login', { error: 'Invalid username or password' });
        }
        res.status(error.status || 500).render('auth/login', { error: error.message || 'An internal error occurred during login.' });
    }
};

// Logout function to destroy the session and redirect to login page
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).send("Could not log out.");
        }
        res.redirect('/auth/login');
    });
};