const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { db } = require('../config/db');
const { requireAuth, isAdmin } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');
const { 
    bruteForceGuard, 
    recordFailedAttempt, 
    recordSuccessfulLogin, 
    isPasswordCompromised,
    getLoginStats 
} = require('../middleware/bruteforce');

const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

// --- Dedykowany Rate Limiter na auth (ostrzejszy niż globalny) ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minut
    max: 20,                    // Max 20 prób na 15 min (login + register łącznie)
    message: { error: '🛡️ Za dużo zapytań uwierzytelniania. Spróbuj za 15 minut.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Nie licz udanych logowań
});

router.use(authLimiter);

// --- REGISTER ---
router.post('/register', validate(authSchemas.register), async (req, res, next) => {
    const { username, email, password } = req.body;

    // Sprawdź czy hasło nie jest na liście skompromitowanych
    if (isPasswordCompromised(password)) {
        return res.status(400).json({ 
            error: '🚫 To hasło znajduje się na liście najczęściej łamanych haseł. Wybierz silniejsze hasło.' 
        });
    }

    try {
        const hash = await argon2.hash(password, { type: argon2.argon2id });
        const apiToken = crypto.randomBytes(32).toString('hex');
        db.run('INSERT INTO users (id, username, email, password_hash, api_token) VALUES (?, ?, ?, ?, ?)', 
                [crypto.randomUUID(), username, email, hash, apiToken], (err) => {
            if (err) return res.status(400).json({ error: 'Username or email already exists' });
            res.status(201).json({ message: 'User registered' });
        });
    } catch (err) {
        next(err);
    }
});

// --- LOGIN (z pełną ochroną brute-force) ---
router.post('/login', bruteForceGuard, validate(authSchemas.login), (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (!user) {
            // Nie zdradzaj czy email istnieje — ale loguj próbę
            recordFailedAttempt(ip, email, userAgent);
            // Celowe opóźnienie — timing attack prevention
            await argon2.hash('dummy-password-to-waste-time', { type: argon2.argon2id });
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania.' });
        }

        // Sprawdź lockout per user (istniejący mechanizm)
        if (user.lockout_until && Date.now() < user.lockout_until) {
            recordFailedAttempt(ip, email, userAgent);
            const remainingMin = Math.ceil((user.lockout_until - Date.now()) / 60000);
            return res.status(403).json({ 
                error: `Konto tymczasowo zablokowane. Spróbuj za ${remainingMin} min.` 
            });
        }

        // Weryfikacja hasła
        if (!(await argon2.verify(user.password_hash, password))) {
            const attempts = (user.failed_login_attempts || 0) + 1;
            const ipResult = recordFailedAttempt(ip, email, userAgent);
            
            if (attempts >= 5) {
                // Progresywny lockout per user: 15min, 30min, 60min...
                const lockCount = Math.floor(attempts / 5);
                const lockDuration = Math.min(
                    15 * 60 * 1000 * Math.pow(2, lockCount - 1),
                    2 * 60 * 60 * 1000  // max 2h
                );
                const lockoutUntil = Date.now() + lockDuration;
                db.run('UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?', 
                    [attempts, lockoutUntil, user.id]);
                
                console.warn(`🚨 [ACCOUNT-LOCK] User ${email} zablokowany na ${lockDuration / 60000} min (próba #${attempts})`);
                
                return res.status(403).json({ 
                    error: `Konto zablokowane z powodu zbyt wielu nieudanych prób. Spróbuj za ${Math.ceil(lockDuration / 60000)} min.` 
                });
            } else {
                db.run('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);
                return res.status(401).json({ 
                    error: 'Nieprawidłowe dane logowania.',
                    // Podpowiedź ile prób zostało (opcjonalne, można usunąć w produkcji)
                    attemptsRemaining: 5 - attempts
                });
            }
        }

        // --- Logowanie udane ---
        db.run('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?', [user.id]);
        recordSuccessfulLogin(ip, email, userAgent);

        const sessionId = crypto.randomBytes(48).toString('hex');
        const expiresAt = Date.now() + SESSION_EXPIRY;

        db.run(`INSERT INTO sessions (session_id, user_id, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)`, 
                [sessionId, user.id, expiresAt, userAgent, ip]);

        res.cookie('session_id', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: SESSION_EXPIRY,
            signed: true
        });

        res.json({ message: 'Logged in', username: user.username, role: user.role });
    });
});

// --- LOGOUT ---
router.post('/logout', (req, res) => {
    const sessionId = req.signedCookies.session_id;
    if (sessionId) db.run('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
    res.clearCookie('session_id');
    res.json({ message: 'Logged out' });
});

// --- ME ---
router.get('/me', requireAuth, (req, res) => {
    res.json({ user: { username: req.user.username, role: req.user.role, token: req.user.api_token } });
});

// --- ADMIN: Statystyki ataków ---
router.get('/security/stats', requireAuth, isAdmin, (req, res) => {
    getLoginStats((err, stats) => {
        if (err) return res.status(500).json({ error: 'Nie udało się pobrać statystyk.' });
        res.json(stats);
    });
});

module.exports = router;
