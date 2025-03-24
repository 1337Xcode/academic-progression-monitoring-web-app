const express = require('express');
const router = express.Router();
const { Enrollment, Student, Module } = require('../../../models');

// GET /api/v1/grades
router.get('/', async (req, res) => {
    try {
        const grades = await Enrollment.findAll({
            include: [
                { model: Student, attributes: ['sId', 'first_name', 'last_name'] },
                { model: Module, attributes: ['module_title', 'subj_code', 'subj_catalog'] }
            ]
        });
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching grades' });
    }
});

// POST /api/v1/grades
router.post('/', async (req, res) => {
    try {
        const grade = await Enrollment.create(req.body);
        res.status(201).json(grade);
    } catch (error) {
        res.status(500).json({ error: 'Error adding grade' });
    }
});

// PUT /api/v1/grades/:id
router.put('/:id', async (req, res) => {
    try {
        const grade = await Enrollment.findByPk(req.params.id);
        if (!grade) return res.status(404).json({ error: 'Grade not found' });
        await grade.update(req.body);
        res.json(grade);
    } catch (error) {
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
