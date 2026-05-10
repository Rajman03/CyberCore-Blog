const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { initDB } = require('./config/db');

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 4823;

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
            scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
        }
    }
}));

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Zwolnij! Za dużo zapytań."
});
app.use(limiter);

// 4. Body Parsers & Cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser(process.env.SECRET_KEY));
app.use(cors({ origin: true, credentials: true }));

// 5. Static Files
app.use(express.static('public'));

// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Sensitive File Protection
app.use((req, res, next) => {
    const forbidden = ['.db', '.sql', '.env', '.json', 'node_modules'];
    if (forbidden.some(ext => req.url.toLowerCase().endsWith(ext)) || req.url.includes('/db/')) {
        return res.status(403).json({ error: '🚫 Access Denied: Sensitive File' });
    }
    next();
});

// --- Routes Modules ---
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');

// --- Route Mounting ---
app.use('/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); 
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);

// --- Server Launch ---
app.listen(PORT, () => {
    console.log(`
    🚀 SECURE.BLOG ENGINE: ONLINE
    📡 Listening on: http://localhost:${PORT}
    🛡️  Security Mode: ENFORCED (Helmet + CSP + Morgan)
    `);
});
