const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { requireAuth, isAdmin } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

router.get('/', requireAuth, isAdmin, (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    
    db.all('SELECT id, username, email, role FROM users LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
});

const ALLOWED_ROLES = ['admin', 'user', 'premium'];

router.patch('/:id/role', requireAuth, isAdmin, (req, res) => {
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
        logger.security.unauthorized(`/api/users/${req.params.id}/role`, 'invalid_role', req.ip);
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
        if (err) {
            logger.error.server('Role update error', err, { userId: req.user.id, targetId: req.params.id });
            return res.status(500).json({ error: 'Database error' });
        }
        
        logger.security.roleChange(req.params.id, role, req.user.id);
        res.json({ message: 'Role updated' });
    });
});

module.exports = router;
