const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { requireAuth, isAdmin } = require('../middleware/auth');

router.get('/', requireAuth, isAdmin, (req, res) => {
    db.all('SELECT id, username, email, role FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
});

const ALLOWED_ROLES = ['admin', 'user', 'premium'];

router.patch('/:id/role', requireAuth, isAdmin, (req, res) => {
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin", "premium" or "user".' });
    }

    let sql = 'UPDATE users SET role = ? WHERE id = ?';
    let params = [role, req.params.id];
    
    if (role === 'premium') {
        sql = 'UPDATE users SET role = ?, subscription_tier = ? WHERE id = ?';
        params = [role, 'premium', req.params.id];
    } else if (role === 'user') {
        sql = 'UPDATE users SET role = ?, subscription_tier = ? WHERE id = ?';
        params = [role, 'free', req.params.id];
    }

    db.run(sql, params, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Role updated' });
    });
});

module.exports = router;
