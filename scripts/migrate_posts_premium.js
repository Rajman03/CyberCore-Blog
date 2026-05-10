const { db } = require('./config/db');

db.run('ALTER TABLE posts ADD COLUMN is_premium INTEGER DEFAULT 0', (err) => {
    if (err && !err.message.includes('duplicate')) {
        console.error('Migration error:', err.message);
    } else {
        console.log('OK: is_premium column added to posts (or already exists)');
    }
    db.close();
    process.exit(0);
});
