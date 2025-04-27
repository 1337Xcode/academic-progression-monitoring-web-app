const express = require('express');
const router = express.Router();
const { Module, Enrollment, Programme } = require('../../../models');

// GET /api/v1/modules
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit 10
        const offset = (page - 1) * limit;

        if (req.query.count === 'true') {
            const count = await Module.count();
            return res.json({ count });
        }

        const options = {
            attributes: ['module_id', 'module_title', 'subj_code', 'subj_catalog', 'credit_value', 'semester', 'pathway_code', 'programme_id', 'is_core'],
            include: [{ model: Programme }], // Include Programme details
            limit,
            offset,
            order: [['module_id', 'ASC']]
        };

        const { count, rows: modules } = await Module.findAndCountAll(options);
        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            modules
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ error: 'Error fetching modules' });
    }
});

// GET /api/v1/modules/:id - Get a single module by ID
router.get('/:id', async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id, {
             include: [{ model: Programme }]
        });
        if (!module) return res.status(404).json({ error: 'Module not found' });
        res.json(module);
    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(500).json({ error: 'Error fetching module' });
    }
});

// POST /api/v1/modules
router.post('/', async (req, res) => {
    try {
        const module = await Module.create(req.body);
        res.status(201).json(module);
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ error: 'Error creating module' });
    }
});

// PUT /api/v1/modules/:id - Update a module
router.put('/:id', async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        await module.update(req.body);
        res.json(module);
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ error: 'Error updating module' });
    }
});

// DELETE /api/v1/modules/:id - Delete a module
router.delete('/:id', async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Module not found' });

        await Enrollment.destroy({ where: { module_id: module.module_id } });

        await module.destroy();
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ error: 'Error deleting module' });
    }
});

module.exports = router;
