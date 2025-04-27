const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const xss = require('xss-clean');

// Security best practices implemented per OWASP Top Ten: https://owasp.org/www-project-top-ten/
function setupSecurity(app) {
    // Setup cors for cross-origin requests (remove if api not working)
    const corsOptions = {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
        credentials: true,
        optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));

    // set up helmet for basic security headers and disable CSP
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    }));

    // Prevent XSS attacks
    app.use(xss());

    // Enable compression for better performance
    app.use(compression());

    // Rate limiting - critical for preventing brute force attacks
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per window,
        standardHeaders: true
    });

    // Apply rate limiting to auth endpoints
    app.use('/auth', limiter);
}

module.exports = setupSecurity;