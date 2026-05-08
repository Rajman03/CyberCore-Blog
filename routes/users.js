const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { requireAuth, isAdmin } = require('../middleware/auth');

router.get('/', requireAuth, isAdmin, (req, res) => {
    db.all('SELECT id, username, email, role FROM users', (err, rows) => res.json(rows || []));
});

router.patch('/:id/role', requireAuth, isAdmin, (req, res) => {
    db.run('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id], () => res.json({ message: 'Role updated' }));
});

module.exports = router;
