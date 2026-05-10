const express = require('express');
const router = express.Router();
const xss = require('xss');
const { db } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { validate, commentSchemas } = require('../middleware/validation');

router.get('/posts/:postId/comments', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    
    db.all(`SELECT comments.*, users.username FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE post_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?`, [req.params.postId, limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows || []);
    });
});

router.post('/comments', requireAuth, validate(commentSchemas.create), (req, res) => {
    const { post_id, content } = req.body;
    const cleanContent = xss(content);
    
    db.run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', 
        [post_id, req.user.id, cleanContent], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ id: this.lastID, content: cleanContent });
        });
});

module.exports = router;
