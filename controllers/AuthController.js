const { User } = require('../models'); // Import User model
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } }); // Find user by username
        if (user && bcrypt.compareSync(password, user.password_hash)) { // Compare password
            // Create a JWT token
            const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' }); // 
            req.session.token = token;
            req.session.userId = user.user_id; // Set user ID in session
            req.session.role = user.role; // Set user role in session

            // Redirect user based on role
            if (user.role === 'ADMIN') {
                res.redirect('/admin/dashboard');
            } else if (user.role === 'STUDENT') {
                res.redirect('/student/profile');
            } else {
                res.status(403).send('Invalid role');
            }
        } else {
            res.status(401).send('Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
};


exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
};
