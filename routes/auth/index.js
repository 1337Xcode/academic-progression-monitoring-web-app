const express = require('express');
const router = express.Router();

// Shows the login page to the user when they visit /auth/login
router.get('/login', (req, res) => {
    res.render('auth/login'); // Render the login view
});
// # Note: redirect user to respective dashboard after login based on user role

// Shows the registration page to the user when they visit /auth/register
router.get('/register', (req, res) => {
    res.render('auth/register'); // Render the registration view
});
// # Note: Redirect user back to login page after registration

module.exports = router;