const { db } = require('../config/db');

const requireAuth = (req, res, next) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return res.status(401).json({ error: 'Session required' });

    db.get('SELECT * FROM sessions WHERE session_id = ?', [sessionId], (err, session) => {
        if (err || !session) return res.status(401).json({ error: 'Invalid session' });
        
        if (Date.now() > session.expires_at) {
            db.run('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
            return res.status(401).json({ error: 'Session expired' });
        }

        db.get('SELECT id, username, email, role FROM users WHERE id = ?', [session.user_id], (err, user) => {
            if (err || !user) return res.status(401).json({ error: 'User not found' });
            req.user = user;
            next();
        });
    });
};

const loadUserOptional = (req, res, next) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return next();

    db.get('SELECT * FROM sessions WHERE session_id = ?', [sessionId], (err, session) => {
        if (err || !session || Date.now() > session.expires_at) return next();

        db.get('SELECT id, username, email, role FROM users WHERE id = ?', [session.user_id], (err, user) => {
            if (user) req.user = user;
            next();
        });
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ error: 'Forbidden: Admin only' });
};

module.exports = { requireAuth, loadUserOptional, isAdmin };
