const crypto = require('crypto');

/**
 * Generuje token CSRF
 */
function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware: Generuj token CSRF na GET dla formularzy
 */
function csrfProtection(req, res, next) {
    // Generuj token dla każdej sesji
    if (!req.session) {
        req.session = {};
    }
    
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCSRFToken();
    }
    
    // Dla GET żądań - dodaj token do res.locals
    if (req.method === 'GET') {
        res.locals.csrfToken = req.session.csrfToken;
    }
    
    next();
}

/**
 * Middleware: Weryfikuj CSRF token w POST/PUT/DELETE
 */
function verifyCSRFToken(req, res, next) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const token = req.body._csrf || req.headers['x-csrf-token'] || req.query._csrf;
        
        if (!token || !req.session?.csrfToken || token !== req.session.csrfToken) {
            return res.status(403).json({ error: 'CSRF token validation failed' });
        }
    }
    
    next();
}

module.exports = { generateCSRFToken, csrfProtection, verifyCSRFToken };
