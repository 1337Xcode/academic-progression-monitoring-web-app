const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

// Initialize express app
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true })); // Ensure extended is true
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET, // Use secret key from .env file
    resave: false, // Don't save session if unmodified
    saveUninitialized: true // Always create a session to keep track of the user
}));

// Static files setup
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes setup
const adminRoutes = require('./routes/admin/index'); // Import admin routes
const studentRoutes = require('./routes/student'); // Import student routes
const authRoutes = require('./routes/auth'); // Import auth routes

// Home route
app.get('/', (req, res) => {
    res.redirect('/auth/login'); // Redirect to login page
});

app.use('/admin', adminRoutes); // Use admin routes for /admin path
app.use('/student', studentRoutes);  // Use student routes for /student path
app.use('/auth', authRoutes); // Use auth routes for /auth path

// Error handling middleware
const errorMiddleware = require('./middlewares/errorMiddleware'); // Import error middleware module

app.use(errorMiddleware.notFound); // Handle 404 errors
app.use(errorMiddleware); // Handle other errors (e.g. 500)

// Export app
module.exports = app;