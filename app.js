const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const multer = require('multer');

// Import security configuration
const setupSecurity = require('./config/securityConfig');

dotenv.config();

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
    name: "web_project_session",
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// List of paths that should be exempt from CSRF protection
const csrfExcludedPaths = [
    '/admin/grades/upload'
];

// Custom CSRF middleware that excludes specific paths
app.use((req, res, next) => {
    // Skip CSRF for excluded paths
    if (csrfExcludedPaths.includes(req.path)) {
        return next();
    }
    
    // Apply CSRF protection for all other routes
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

// Home route
app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

// Use routes
app.use('/admin', adminRoutes);
app.use('/student', studentRoutes);
app.use('/auth', authRoutes);

// Special route for CSRF debugging
app.get('/check-csrf', (req, res) => {
    res.send(`CSRF token: ${req.csrfToken ? req.csrfToken() : 'Not available'}`);
});
app.post('/check-csrf', (req, res) => {
    res.send('CSRF validation successful');
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Handle CSRF token errors
        console.error('CSRF Error:', req.method, req.path);
        return res.status(403).send('CSRF token verification failed. Please try again.');
    }
    next(err);
});

// Import and use error middleware
const errorMiddleware = require('./middlewares/errorMiddleware');
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.internalServerError);

module.exports = app;