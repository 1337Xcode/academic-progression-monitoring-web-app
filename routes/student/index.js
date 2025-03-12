const express = require('express');
const router = express.Router();
const StudentController = require('../../controllers/StudentController');
const { isAuthenticated } = require('../../middlewares/authMiddleware');

// Student profile route
router.get('/profile', isAuthenticated, StudentController.profile);
router.post('/profile/update', isAuthenticated, StudentController.updateProfile);

module.exports = router;