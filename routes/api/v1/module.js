const express = require('express');
const router = express.Router();
const { Module } = require('../../../models');

// GET /api/v1/modules
router.get('/', async (req, res) => {
    try {
        const modules = await Module.findAll({
            attributes: ['module_id', 'module_title', 'subj_code', 'subj_catalog', 'credit_value', 'semester', 'pathway_code']
        });
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching modules' });
    }
});

// POST /api/v1/modules
router.post('/', async (req, res) => {
    try {
        const module = await Module.create(req.body);
        res.status(201).json(module);
    } catch (error) {
        res.status(500).json({ error: 'Error creating module' });
    }
});

module.exports = router;
