const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const crypto = require('crypto');
const { db } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');

const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

router.post('/register', validate(authSchemas.register), async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hash = await argon2.hash(password, { type: argon2.argon2id });
        db.run('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', 
                [crypto.randomUUID(), username, email, hash], (err) => {
            if (err) return res.status(400).json({ error: 'Username or email already exists' });
            res.status(201).json({ message: 'User registered' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', validate(authSchemas.login), (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (!user || !(await argon2.verify(user.password_hash, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const sessionId = crypto.randomBytes(48).toString('hex');
        const expiresAt = Date.now() + SESSION_EXPIRY;

        db.run(`INSERT INTO sessions (session_id, user_id, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)`, 
                [sessionId, user.id, expiresAt, req.headers['user-agent'], req.ip]);

        res.cookie('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_EXPIRY
        });

        res.json({ message: 'Logged in', username: user.username, role: user.role });
    });
});

router.post('/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) db.run('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
    res.clearCookie('session_id');
    res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: { username: req.user.username, role: req.user.role } });
});

module.exports = router;
