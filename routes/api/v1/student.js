const express = require('express');
const router = express.Router();
const { Student } = require('../../../models');

// GET /api/v1/students
router.get('/', async (req, res) => {
    try {
        const students = await Student.findAll({
            attributes: ['student_id', 'sId', 'first_name', 'last_name', 'programme_id', 'entry_level', 'acad_yr', 'status_study']
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching students' });
    }
});

// POST /api/v1/students
router.post('/', async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ error: 'Error creating student' });
    }
});

module.exports = router;
