const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const { db } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { validate, profileSchemas } = require('../middleware/validation');

router.get('/', requireAuth, (req, res) => {
    res.json(req.user);
});

router.patch('/', requireAuth, validate(profileSchemas.update), (req, res) => {
    const { username, email } = req.body;
    db.run('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, req.user.id], (err) => {
        if (err) return res.status(400).json({ error: 'Data already in use' });
        res.json({ message: 'Profile updated' });
    });
});

router.patch('/password', requireAuth, validate(profileSchemas.password), (req, res) => {
    const { oldPassword, newPassword } = req.body;
    db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (!(await argon2.verify(user.password_hash, oldPassword))) {
            return res.status(400).json({ error: 'Old password incorrect' });
        }
        const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id], () => res.json({ message: 'Password changed' }));
    });
});

module.exports = router;
