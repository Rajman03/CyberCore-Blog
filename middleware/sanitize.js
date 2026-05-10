const sanitizeHtml = require('sanitize-html');

const sanitizePayload = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Strips all HTML tags
                req.body[key] = sanitizeHtml(req.body[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            }
        }
    }
    
    if (req.query && typeof req.query === 'object') {
        for (let key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeHtml(req.query[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            }
        }
    }
    
    if (req.params && typeof req.params === 'object') {
        for (let key in req.params) {
            if (typeof req.params[key] === 'string') {
                req.params[key] = sanitizeHtml(req.params[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            }
        }
    }
    
    next();
};

module.exports = { sanitizePayload };
