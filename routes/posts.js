const express = require('express');
const router = express.Router();
const xss = require('xss');
const { db } = require('../config/db');
const { requireAuth, isAdmin } = require('../middleware/auth');
const { validate, postSchemas } = require('../middleware/validation');

router.get('/', (req, res) => {
    db.all('SELECT posts.*, users.username as author FROM posts JOIN users ON posts.author_id = users.id ORDER BY created_at DESC', 
    (err, rows) => res.json(rows || []));
});

router.post('/', requireAuth, isAdmin, validate(postSchemas.create), (req, res) => {
    const { title, content } = req.body;
    const safeContent = xss(content);
    db.run('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)', [title, safeContent, req.user.id], () => res.status(201).json({ message: 'Post live' }));
});

router.delete('/:id', requireAuth, isAdmin, (req, res) => {
    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], () => res.json({ message: 'Post nuked' }));
});

module.exports = router;
