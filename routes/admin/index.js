const express = require('express');
const router = express.Router();

// Define admin routes here
router.get('/', (req, res) => {
    res.render('admin/dashboard'); // Render the admin dashboard view
});

module.exports = router;
