const express = require('express');
const router = express.Router();
const xss = require('xss');
const { db } = require('../config/db');
const { requireAuth, isAdmin, loadUserOptional } = require('../middleware/auth');
const { validate, postSchemas } = require('../middleware/validation');

// GET all posts (public)
router.get('/', loadUserOptional, (req, res) => {
    const isPremium = req.user?.subscription_tier === 'premium' || req.user?.role === 'admin' || req.user?.role === 'premium';

    db.all(
        'SELECT posts.*, users.username as author FROM posts JOIN users ON posts.author_id = users.id ORDER BY created_at DESC',
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            const posts = rows.map(post => {
                if (post.is_premium && !isPremium) {
                    return { ...post, content: post.content.substring(0, 150) + '... [Zablokowana treść Premium]', locked: true };
                }
                return post;
            });
            res.json(posts || []);
        }
    );
});

// POST create post (admin only)
router.post('/', requireAuth, isAdmin, validate(postSchemas.create), (req, res) => {
    const { title, content, is_premium } = req.body;
    const safeTitle = xss(title);
    const safeContent = xss(content);
    const premiumFlag = is_premium ? 1 : 0;
    
    db.run(
        'INSERT INTO posts (title, content, author_id, is_premium) VALUES (?, ?, ?, ?)',
        [safeTitle, safeContent, req.user.id, premiumFlag],
        function(err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ message: 'Post created', id: this.lastID });
        }
    );
});

// DELETE post (admin only)
router.delete('/:id', requireAuth, isAdmin, (req, res) => {
    db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Post not found' });
        res.json({ message: 'Post deleted' });
    });
});

module.exports = router;

