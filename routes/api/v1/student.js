const express = require('express');
const router = express.Router();
const { Student, User, Enrollment, Notification, Programme } = require('../../../models');

// GET /api/v1/students
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit 10
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.user_id) {
            whereClause.user_id = req.query.user_id;
        }

        if (req.query.count === 'true') {
            const count = await Student.count({ where: whereClause });
            return res.json({ count });
        }

        const options = {
            where: whereClause,
            attributes: ['student_id', 'sId', 'first_name', 'last_name', 'programme_id', 'entry_level', 'acad_yr', 'status_study', 'user_id', 'secondary_email', 'phone', 'profile_image'],
            include: [
                { model: User, attributes: ['username', 'email'] }, // Include User details
                { model: Programme } // Include Programme details
            ],
            limit,
            offset,
            order: [['student_id', 'ASC']]
        };

        const { count, rows: students } = await Student.findAndCountAll(options);
        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Error fetching students' });
    }
});

// GET /api/v1/students/:id - Get a single student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['username', 'email'] },
                { model: Programme }
            ]
        });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Error fetching student' });
    }
});

// POST /api/v1/students
router.post('/', async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: 'Invalid user_id or programme_id' });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Student ID (sId) already exists' });
        }
        res.status(500).json({ error: 'Error creating student' });
    }
});

// PUT /api/v1/students/:id - Update a student
router.put('/:id', async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Exclude potentially sensitive or immutable fields
        const { user_id, sId, ...updateData } = req.body;
        await student.update(updateData);
        res.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Check which constraint failed if multiple unique fields exist
             if (error.fields && error.fields.secondary_email) {
                 return res.status(409).json({ error: 'Secondary email already in use.' });
             }
             if (error.fields && error.fields.phone) {
                 return res.status(409).json({ error: 'Phone number already in use.' });
             }
             return res.status(409).json({ error: 'Unique constraint violation.' });
        }
        res.status(500).json({ error: 'Error updating student' });
    }
});

// DELETE /api/v1/students/:id - Delete a student and related data
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const userId = student.user_id;

        // delete related data before deleting the student
        await Notification.destroy({ where: { student_id: student.student_id } });
        await Enrollment.destroy({ where: { student_id: student.student_id } });

        await student.destroy(); // Delete the student record

        // delete the associated user account and notifications
        if (userId) {
            await Notification.destroy({ where: { sender_id: userId } });
            await User.destroy({ where: { user_id: userId } });
        }

        res.json({ message: 'Student and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Error deleting student' });
    }
});

module.exports = router;
