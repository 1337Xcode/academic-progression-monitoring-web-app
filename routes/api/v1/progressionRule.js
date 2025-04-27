const express = require('express');
const router = express.Router();
const { ProgressionRule } = require('../../../models');

// GET all progression rules
router.get('/', async (req, res) => {
    try {
        const rules = await ProgressionRule.findAll();
        res.json(rules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a progression rule by id
router.get('/:id', async (req, res) => {
    try {
        const rule = await ProgressionRule.findByPk(req.params.id);
        if (!rule) return res.status(404).json({ error: 'Not found' });
        res.json(rule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE a new progression rule
router.post('/', async (req, res) => {
    try {
        const rule = await ProgressionRule.create(req.body);
        res.status(201).json(rule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// UPDATE a progression rule
router.put('/:id', async (req, res) => {
    try {
        const [updated] = await ProgressionRule.update(req.body, {
            where: { rule_id: req.params.id }
        });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        const rule = await ProgressionRule.findByPk(req.params.id);
        res.json(rule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a progression rule
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await ProgressionRule.destroy({
            where: { rule_id: req.params.id }
        });
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
