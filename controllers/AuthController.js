const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const { badRequest } = require('../middlewares/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

exports.login = async (req, res, next) => {
    const { username, password, recaptchaResponse } = req.body;

    if (!recaptchaResponse) {
        console.error("No reCAPTCHA token provided.");
        return badRequest(req, res, next, 'Captcha token is missing.');
    }

    // Verify the reCAPTCHA token with Google's API
    // Code docs: https://developers.google.com/recaptcha/docs/verify
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        const verificationResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(recaptchaResponse)}`
        });

        const verificationData = await verificationResponse.json();
        console.log("reCAPTCHA verification response:", verificationData);

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

    // Proceed with authentication
    try {
        // Find the user
        const user = await User.findOne({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.render('auth/login', { error: 'Invalid username or password' });
        }

        // Create JWT token with expiration time
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        req.session.token = token;
        req.session.userId = user.user_id;
        req.session.role = user.role;

        if (user.role === 'STUDENT') {
            res.redirect('/student/dashboard');
        } else if (user.role === 'ADMIN') {
            res.redirect('/admin/dashboard');
        } else {
            res.status(403).send('Invalid role');
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Error logging in');
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
};