const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middlewares/authMiddleware'); // Import the isAdmin middleware

// Define admin routes here
router.get('/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard'); // Render the admin dashboard view
});

module.exports = router;
