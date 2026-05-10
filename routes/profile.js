const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const { db } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { validate, profileSchemas } = require('../middleware/validation');
const { isPasswordCompromised } = require('../middleware/bruteforce');
const { logger } = require('../middleware/logger');

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

router.patch('/password', requireAuth, validate(profileSchemas.password), async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Sprawdź czy nowe hasło nie jest na liście skompromitowanych
    if (isPasswordCompromised(newPassword)) {
        logger.security.passwordChange(req.user.id, false, req.ip, { reason: 'compromised_password' });
        return res.status(400).json({ 
            error: '🚫 To hasło znajduje się na liście najczęściej łamanych haseł. Wybierz silniejsze hasło.' 
        });
    }
    
    // Sprawdź czy stare hasło jest poprawne
    db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (err || !user) {
            logger.error.server('Password change error', err, { userId: req.user.id });
            return res.status(500).json({ error: 'Błąd serwera' });
        }
        
        if (!(await argon2.verify(user.password_hash, oldPassword))) {
            logger.security.passwordChange(req.user.id, false, req.ip, { reason: 'invalid_old_password' });
            return res.status(400).json({ error: 'Old password incorrect' });
        }
        
        const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
        db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id], (err) => {
            if (err) {
                logger.error.server('Password hash update error', err, { userId: req.user.id });
                return res.status(500).json({ error: 'Błąd serwera' });
            }
            
            logger.security.passwordChange(req.user.id, true, req.ip);
            res.json({ message: 'Password changed' });
        });
    });
});

module.exports = router;
