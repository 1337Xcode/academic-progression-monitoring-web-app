const express = require('express');
const router = express.Router();
const { Enrollment, Student, Module } = require('../../../models');

// GET /api/v1/grades
router.get('/', async (req, res) => {
    try {
        const whereClause = {};
        if (req.query.student_id) {
            whereClause.student_id = req.query.student_id;
        }

        const grades = await Enrollment.findAll({
            where: whereClause,
            include: [
                { model: Student, attributes: ['student_id', 'sId', 'first_name', 'last_name'] }, // Added student_id
                { model: Module, attributes: ['module_id', 'module_title', 'subj_code', 'subj_catalog'] } // Added module_id
            ],
            order: [['enrollment_id', 'ASC']] // Optional: Add default ordering
        });
        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ error: 'Error fetching grades' });
    }
});

// POST /api/v1/grades
router.post('/', async (req, res) => {
    try {
        // Add validation for required fields
        const { student_id, module_id } = req.body;
        if (!student_id || !module_id) {
            return res.status(400).json({ error: 'Missing student_id or module_id' });
        }
        // Check if student and module exist before creating enrollment
        const studentExists = await Student.findByPk(student_id);
        const moduleExists = await Module.findByPk(module_id);
        if (!studentExists || !moduleExists) {
            return res.status(404).json({ error: 'Student or Module not found' });
        }

        const grade = await Enrollment.create(req.body);
        res.status(201).json(grade);
    } catch (error) {
        console.error('Error adding grade:', error);
        // Handle the annoying Sequelize unique constraint error again
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ error: 'Invalid student_id or module_id provided.' });
        }
        res.status(500).json({ error: 'Error adding grade' });
    }
});

// PUT /api/v1/grades/:id
router.put('/:id', async (req, res) => {
    try {
        const grade = await Enrollment.findByPk(req.params.id);
        if (!grade) return res.status(404).json({ error: 'Grade not found' });

        // Prevent changing student_id or module_id on update
        const { student_id, module_id, ...updateData } = req.body;
        await grade.update(updateData);
        res.json(grade);
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({ error: 'Error updating grade' });
    }
});

// DELETE /api/v1/grades/:id
router.delete('/:id', async (req, res) => {
    try {
        const grade = await Enrollment.findByPk(req.params.id);
        if (!grade) return res.status(404).json({ error: 'Grade not found' });
        await grade.destroy();
        res.json({ message: 'Grade deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting grade' });
    }
});

module.exports = router;
