const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Simple in-memory rate limiting (consider using Redis in production)
const rateLimitStore = new Map();

// username and password regex
const usernameRegex = /^[a-zA-Z0-9_-]{5,30}$/; // Allows alphanumeric characters, underscore and hyphen
const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_\-+=[\]{}|\\:;<>,.?/]{5,30}$/; // Basic safety check

exports.login = async (req, res) => {
    const { username, password, recaptchaResponse } = req.body;

    // Validate username
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            error: 'Invalid username format. Must be 5-30 characters using only letters, numbers, underscores or hyphens.'
        });
    }

    // Validate password
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error: 'Invalid password format. Must be 5-30 characters and contain only letters, numbers, and basic special characters.'
        });
    }

    if (!recaptchaResponse) {
        console.error("No reCAPTCHA token provided.");
        return res.status(400).send('Captcha token is missing.');
    }

    // Verify the reCAPTCHA token with Google's API
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
            return res.status(400).send('Failed captcha verification.');
        }
    } catch (error) {
        console.error("Error during captcha verification:", error);
        return res.status(500).send('Error verifying captcha.');
    }

    // Proceed with rate limiting and authentication
    try {
        const rateLimit = 5;
        const rateLimitWindow = 60 * 1000; // 1 minute
        const now = Date.now();
        const rateLimitKey = `login:${username}`;

        // Get attempts for this username
        const attempts = rateLimitStore.get(rateLimitKey) || { count: 0, resetAt: now + rateLimitWindow };

        if (attempts.count >= rateLimit && attempts.resetAt > now) {
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
        }

        if (attempts.resetAt <= now) {
            attempts.count = 0;
            attempts.resetAt = now + rateLimitWindow;
        }

        // Find the user
        const user = await User.findOne({ where: { username } });

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            attempts.count += 1;
            rateLimitStore.set(rateLimitKey, attempts);
            return res.status(401).send('Invalid username or password');
        }

        // Reset rate limit on successful login
        rateLimitStore.delete(rateLimitKey);

        // Create JWT token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        req.session.token = token;
        req.session.userId = user.user_id;
        req.session.role = user.role;

        if (user.role === 'ADMIN') {
            res.redirect('/admin/dashboard');
        } else if (user.role === 'STUDENT') {
            res.redirect('/student/profile');
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