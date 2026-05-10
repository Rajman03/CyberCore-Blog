const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const hpp = require('hpp');
const { sanitizePayload } = require('./middleware/sanitize');
const { errorLoggingMiddleware } = require('./middleware/logger');
require('dotenv').config();

const { initDB, DATABASE_TYPE } = require('./config/db');

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 4823;

/**
 * Start Server - Async wrapper to handle database initialization
 */
const startServer = async () => {
    // --- Database ---
    try {
        console.log(`🔄 Initializing ${DATABASE_TYPE} database...`);
        await initDB();
        console.log(`✅ ${DATABASE_TYPE.toUpperCase()} database initialized`);
    } catch (err) {
        console.error('❌ Failed to initialize database:', err.message);
        process.exit(1);
    }
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(301, `https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// --- Database ---
initDB();

// --- Global Middleware ---
// 1. Morgan Logging
app.use(morgan('combined'));

// 2. Helmet Security Headers (with CSP)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://fonts.googleapis.com"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            upgradeInsecureRequests: [],
            blockAllMixedContent: []
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { 
        policy: 'strict-origin-when-cross-origin' 
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny' // CLICKJACKING protection
    }
}));

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, // Standard limit
    message: "Zwolnij! Za dużo zapytań.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.ip || req.connection.remoteAddress
});
app.use(limiter);

// 4. Body Parsers & Cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser(process.env.SECRET_KEY || 'default-secret-key'));
app.use(cors({ 
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4823'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 5. Data Sanitization & HTTP Parameter Pollution
app.use(sanitizePayload);
app.use(hpp());

// Sensitive File Protection (MUST be before static files)
app.use((req, res, next) => {
    const url = req.url.toLowerCase();
    const forbidden = ['.db', '.sql', '.env', 'node_modules'];
    if (forbidden.some(ext => url.endsWith(ext) || url.includes(ext)) || url.includes('/db/')) {
        return res.status(403).json({ error: '🚫 Access Denied: Sensitive File' });
    }
    next();
});

// 6. Static Files
app.use(express.static('public'));

// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- Routes Modules ---
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');
const paywallRoutes = require('./routes/paywall');

// --- Route Mounting ---
app.use('/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); 
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/paywall', paywallRoutes);

// --- SPA Catch-all ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('🚨 Błąd serwera:', err.stack);
    res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

// Error logging middleware (must be after error handler)
app.use(errorLoggingMiddleware);

// --- Server Launch ---
app.listen(PORT, () => {
    console.log(`
    🚀 SECURE.BLOG ENGINE: ONLINE
    📡 Listening on: http://localhost:${PORT}
    🛡️  Security Mode: ENFORCED (Helmet + CSP + Morgan)
    `);
});
