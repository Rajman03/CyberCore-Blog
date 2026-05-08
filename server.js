const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

const { initDB } = require('./config/db');

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database ---
initDB();

// --- View Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// --- Global Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Security Headers (CSP)
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self';"
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Sensitive File Protection
app.use((req, res, next) => {
    const forbidden = ['.db', '.sql', '.env', '.json', 'node_modules'];
    if (forbidden.some(ext => req.url.toLowerCase().endsWith(ext)) || req.url.includes('/db/')) {
        return res.status(403).json({ error: '🚫 Access Denied: Sensitive File' });
    }
    next();
});

app.use(express.static('public'));

// --- Routes Modules ---
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users');
const pageRoutes = require('./routes/pages');

// --- Route Mounting ---
app.use('/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', commentRoutes); // includes /api/comments and /api/posts/:id/comments
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/', pageRoutes);

// --- Server Launch ---
app.listen(PORT, () => {
    console.log(`
    🚀 SECURE.BLOG ENGINE: ONLINE
    📡 Listening on: http://localhost:${PORT}
    🛡️  Security Mode: ENFORCED
    `);
});
