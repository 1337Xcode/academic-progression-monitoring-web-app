const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const studentRoutes = require('./student');
const moduleRoutes = require('./module');
const gradesRoutes = require('./grades');
const progressionRuleRoutes = require('./progressionRule');

// routes for API
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/modules', moduleRoutes);
router.use('/grades', gradesRoutes);
router.use('/progression-rules', progressionRuleRoutes);

module.exports = router;
