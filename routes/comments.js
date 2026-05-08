const express = require('express');
const router = express.Router();
const xss = require('xss');
const { db } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.get('/:postId/comments', (req, res) => {
    db.all(`SELECT comments.*, users.username FROM comments 
            JOIN users ON comments.user_id = users.id 
            WHERE post_id = ? ORDER BY created_at ASC`, [req.params.postId], (err, rows) => {
        res.json(rows || []);
    });
});

router.post('/comments', requireAuth, (req, res) => {
    const { post_id, content } = req.body;
    const cleanContent = xss(content);
    
    db.run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', 
        [post_id, req.user.id, cleanContent], function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ id: this.lastID, content: cleanContent });
        });
});

module.exports = router;
