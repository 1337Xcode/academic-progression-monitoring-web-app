const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const studentRoutes = require('./student');
const moduleRoutes = require('./module');
const gradesRoutes = require('./grades');

router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/modules', moduleRoutes);
router.use('/grades', gradesRoutes);

module.exports = router;
