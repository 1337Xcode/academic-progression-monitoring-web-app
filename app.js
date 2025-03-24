const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// Import security configuration
const setupSecurity = require('./config/securityConfig');

dotenv.config(); // Load environment variables

// Initialize express app
const app = express();

// Setup security middleware
setupSecurity(app);

// Basic middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session setup
app.use(session({
    name: "apms_session", // Session name in the cookie
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookie in production
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// List of paths that should be exempt from CSRF protection
const csrfExcludedPaths = [
    '/admin/grades/upload',
    '/student/profile/image',
    '/api'
];

// Custom CSRF middleware that excludes specific paths
app.use((req, res, next) => {
    if (csrfExcludedPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    csrf({ cookie: false })(req, res, next);
});

// Make CSRF token available to all views
app.use((req, res, next) => {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
});

// Import routes
const adminRoutes = require('./routes/admin/index');
const studentRoutes = require('./routes/student');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api'); // Add this line to import API routes

// Home route
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

// Use routes
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/auth', authRoutes);
// app.use('/api', apiRoutes); // Add this line and comment the code below to use API routes without api key

// API key middleware for /api routes
app.use('/api', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
    }
    next();
}, apiRoutes); // Protect all /api routes


// Error handling middleware for CSRF errors
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Handle CSRF token errors
        console.error('CSRF Error:', req.method, req.path);
        // Use the general error template for CSRF errors
        return res.status(403).render('error', {
            title: 'Security Error: CSRF Token Validation Failed',
            message: 'Your form submission could not be processed due to a security check failure.'
        });
    }
    next(err);
});

// Import and use error middleware
const errorMiddleware = require('./middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.internalServerError);

module.exports = app;