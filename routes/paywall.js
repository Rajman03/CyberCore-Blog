const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { requireAuth, loadUserOptional } = require('../middleware/auth');

// ─── GET /api/paywall/articles ─────────────────────────────
// Zwraca listę artykułów premium (preview tylko dla gości)
router.get('/articles', loadUserOptional, (req, res) => {
    const isPremium = req.user?.subscription_tier === 'premium' || req.user?.role === 'admin' || req.user?.role === 'premium';

    db.all(
        'SELECT posts.*, users.username as author FROM posts JOIN users ON posts.author_id = users.id WHERE posts.is_premium = 1 ORDER BY created_at DESC',
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const articles = rows.map(post => ({
                id: post.id,
                title: post.title,
                excerpt: post.content.substring(0, 150) + '...',
                readTime: '5 min',
                category: 'Premium',
                badge: '⭐ Premium',
                premium: true,
                locked: !isPremium
            }));

            res.json({ articles, isPremium });
        }
    );
});

// ─── GET /api/paywall/article/:id ──────────────────────────
// Zwraca pełną treść — tylko dla premium lub artykułu darmowego
router.get('/article/:id', loadUserOptional, (req, res) => {
    const id = parseInt(req.params.id);
    const isPremium = req.user?.subscription_tier === 'premium' || req.user?.role === 'admin' || req.user?.role === 'premium';

    db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, post) => {
        if (err || !post) return res.status(404).json({ error: 'Post not found' });

        // Anti-bypass headers to prevent 12ft.io, Google Cache, and Reader Modes from caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Robots-Tag', 'noarchive, nosnippet, notranslate, noimageindex');

        if (post.is_premium && !isPremium) {
            return res.status(403).json({
                error: 'Dostęp wymaga subskrypcji Premium',
                requiresPremium: true,
                preview: post.content.substring(0, 200) + '...'
            });
        }

        res.json({ article: post });
    });
});

// ─── POST /api/paywall/create-checkout-session ────────────────
// Rzeczywista integracja ze Stripe (zastąp własnym kluczem API)
router.post('/create-checkout-session', requireAuth, async (req, res) => {
    const { plan } = req.body;
    
    // TODO: Zastąp to kodem Stripe:
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({
    //     payment_method_types: ['card', 'blik'],
    //     mode: 'subscription',
    //     line_items: [{ price: plan === 'monthly' ? 'price_123' : 'price_456', quantity: 1 }],
    //     success_url: `http://localhost:4823/paywall.html?success=true`,
    //     cancel_url: `http://localhost:4823/paywall.html?canceled=true`,
    //     client_reference_id: req.user.id
    // });
    // return res.json({ url: session.url });

    // Symulacja zwrócenia URLa do Stripe Checkout
    res.json({ url: `/paywall.html?simulated_stripe_checkout=true&plan=${plan}` });
});

// ─── POST /api/paywall/webhook ─────────────────────────────────
// Webhook do nasłuchiwania eventów ze Stripe (np. po opłaceniu)
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    // TODO: Zweryfikuj sygnaturę Stripe (stripe.webhooks.constructEvent)
    const event = req.body; 

    // Symulacja obsługi eventu zapłaty
    if (event.type === 'checkout.session.completed') {
        const userId = event.data.object.client_reference_id;
        db.run(
            `UPDATE users SET subscription_tier = 'premium', role = CASE WHEN role = 'user' THEN 'premium' ELSE role END WHERE id = ?`,
            [userId]
        );
    }
    
    res.json({ received: true });
});

// ─── POST /api/paywall/subscribe ───────────────────────────
// Testowa symulacja zakupu subskrypcji (bez prawdziwej płatności)
router.post('/subscribe', requireAuth, (req, res) => {
    const { plan } = req.body;
    if (!['monthly', 'yearly'].includes(plan)) {
        return res.status(400).json({ error: 'Nieprawidłowy plan' });
    }

    // Symuluj opóźnienie bramki płatności
    setTimeout(() => {
        db.run(
            `UPDATE users 
             SET subscription_tier = ?, 
                 role = CASE WHEN role = 'user' THEN 'premium' ELSE role END 
             WHERE id = ?`,
            ['premium', req.user.id],
            function (err) {
                if (err) return res.status(500).json({ error: 'Błąd bazy danych' });

                const prices = { monthly: '29 PLN/mies.', yearly: '199 PLN/rok' };
                res.json({
                    success: true,
                    message: `✅ Subskrypcja Premium aktywna! Plan: ${prices[plan]}`,
                    tier: 'premium',
                });
            }
        );
    }, 1500);
});

// ─── POST /api/paywall/unsubscribe ─────────────────────────
// Anuluj subskrypcję (test)
router.post('/unsubscribe', requireAuth, (req, res) => {
    db.run(
        `UPDATE users 
         SET subscription_tier = ?, 
             role = CASE WHEN role = 'premium' THEN 'user' ELSE role END 
         WHERE id = ?`,
        ['free', req.user.id],
        function (err) {
            if (err) return res.status(500).json({ error: 'Błąd bazy danych' });
            res.json({ success: true, message: 'Subskrypcja anulowana.', tier: 'free' });
        }
    );
});

// ─── GET /api/paywall/status ───────────────────────────────
// Sprawdź status subskrypcji aktualnego użytkownika
router.get('/status', requireAuth, (req, res) => {
    if (req.user.role === 'admin') {
        return res.json({ tier: 'premium', isAdmin: true });
    }

    db.get(
        'SELECT subscription_tier FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
            if (err || !row) return res.status(500).json({ error: 'Błąd' });
            res.json({ tier: row.subscription_tier || 'free', isAdmin: false });
        }
    );
});

module.exports = router;
