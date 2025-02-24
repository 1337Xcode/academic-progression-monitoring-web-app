const express = require('express');
const router = express.Router();
const { isStudent } = require('../../middlewares/authMiddleware');

// Define student routes here
router.get('/profile', isStudent, (req, res) => {
    res.render('student/profile'); // Render the student profile view
});

module.exports = router;