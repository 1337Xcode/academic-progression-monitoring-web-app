const express = require('express');
const router = express.Router();
const { User } = require('../../../models');
const bcrypt = require('bcrypt');

// GET /api/v1/users - Get a list of users or count
router.get('/', async (req, res) => {
    try {
        if (req.query.count === 'true') {
            const count = await User.count({ where: { role: 'ADMIN' } }); // Count only admin users
            return res.json({ count });
        }
        if (req.query.username) {
            const user = await User.findOne({ where: { username: req.query.username } });
            if (!user) return res.status(404).json({ error: 'User not found' });
            return res.json(user);
        }
        const users = await User.findAll({ attributes: ['user_id', 'username', 'email', 'role'] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// GET /api/v1/users/:id - Get a single user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: ['user_id', 'username', 'email', 'role'] });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// POST /api/v1/users - Create a new user
router.post('/', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        // Basic validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newUser = await User.create({
            username,
            email,
            password_hash: bcrypt.hashSync(password, 10),
            role
        });
        // Return only non-sensitive data
        const { password_hash, ...userData } = newUser.get({ plain: true });
        res.status(201).json(userData);
    } catch (error) {
        // Handle potential unique constraint errors, etc.
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Error creating user' });
    }
});

// PUT /api/v1/users/:id - Update a user
router.put('/:id', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updateData = { username, email, role };
        if (password) {
            updateData.password_hash = bcrypt.hashSync(password, 10);
        }

        await user.update(updateData);
        // Return only non-sensitive data
        const { password_hash, ...userData } = user.get({ plain: true });
        res.json(userData);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Error updating user' });
    }
});

// DELETE /api/v1/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
});

module.exports = router;
