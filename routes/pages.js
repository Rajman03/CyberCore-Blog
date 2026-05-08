const express = require('express');
const router = express.Router();
const { requireAuth, isAdmin, loadUserOptional } = require('../middleware/auth');

router.get('/', loadUserOptional, (req, res) => res.render('index', { user: req.user }));
router.get('/login.html', (req, res) => res.render('login'));
router.get('/register.html', (req, res) => res.render('register'));
router.get('/profile.html', requireAuth, (req, res) => res.render('profile', { user: req.user }));
router.get('/admin.html', requireAuth, isAdmin, (req, res) => res.render('admin', { user: req.user }));
router.get('/forgot-password.html', (req, res) => res.render('forgot-password'));
router.get('/reset-password.html', (req, res) => res.render('reset-password'));

module.exports = router;
