const express = require('express');
const router = express.Router();

// Define student routes here
router.get('/', (req, res) => {
    res.render('student/dashboard'); // Render the student dashboard view
});

module.exports = router;