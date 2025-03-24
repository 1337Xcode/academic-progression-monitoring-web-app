const express = require('express');
const router = express.Router();
const { User } = require('../../../models');
const bcrypt = require('bcrypt');

// GET /api/v1/users - Get a list of users
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['user_id', 'username', 'email', 'role'] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// POST /api/v1/users - Create a new user
router.post('/', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const newUser = await User.create({
            username,
            email,
            password_hash: bcrypt.hashSync(password, 10),
            role
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

module.exports = router;
