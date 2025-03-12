const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cors = require('cors');
const bodyParser = require('body-parser');

function setupSecurity(app) {
    // CSP violation reporting endpoint - exempt from CSRF
    app.post('/csp-violation-report', bodyParser.json({
        type: ['json', 'application/csp-report']
    }), (req, res) => {
        console.log('CSP Violation:', req.body); // comment out in production
        res.status(204).end();
    });

    // Basic security headers with helmet
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "https://www.google.com",
                    "https://www.gstatic.com",
                    "https://www.google.com/recaptcha/",
                    "https://www.gstatic.com/recaptcha/",
                    "'unsafe-inline'"
                ],
                styleSrc: [
                    "'self'", 
                    "https://fonts.googleapis.com", 
                    "https://cdnjs.cloudflare.com", 
                    "'unsafe-inline'"
                ],
                fontSrc: [
                    "'self'", 
                    "https://fonts.gstatic.com", 
                    "https://cdnjs.cloudflare.com",
                    "data:"
                ],
                imgSrc: ["'self'", "data:", "https://www.google.com", "https://www.gstatic.com"],
                connectSrc: ["'self'", "https://www.google.com", "https://www.gstatic.com"],
                objectSrc: ["'none'"],
                frameSrc: ["https://www.google.com", "https://www.google.com/recaptcha/"],
                upgradeInsecureRequests: [],
                reportUri: '/csp-violation-report',
            }
        },
        crossOriginEmbedderPolicy: false
    }));

    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        next();
    });

    // Configure CORS
    const corsOptions = {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);

    // Speed limiter
    const speedLimiter = slowDown({
        windowMs: 15 * 60 * 1000,
        delayAfter: 50,
        delayMs: () => 250
    });
    app.use(speedLimiter);

    // Cache control for static assets
    app.use((req, res, next) => {
        if (req.url.startsWith('/public')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year (365*24*60*60)
        }
        next();
    });
}

module.exports = setupSecurity;