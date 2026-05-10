const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/blog.db');
const crypto = require('crypto');

db.run('ALTER TABLE users ADD COLUMN api_token TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
        console.error('Alter error:', err.message);
    } else {
        console.log('Column api_token ready.');
    }
    
    // Add tokens to existing users
    db.each('SELECT id FROM users WHERE api_token IS NULL', (err, row) => {
        if (row) {
            const token = crypto.randomBytes(32).toString('hex');
            db.run('UPDATE users SET api_token = ? WHERE id = ?', [token, row.id], () => {
                console.log('Token generated for user', row.id);
            });
        }
    });
});
