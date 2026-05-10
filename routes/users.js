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

const ALLOWED_ROLES = ['admin', 'user'];

router.patch('/:id/role', requireAuth, isAdmin, (req, res) => {
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user".' });
    }
    db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Role updated' });
    });
});

module.exports = router;
