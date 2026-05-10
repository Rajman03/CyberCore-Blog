const { db } = require('./config/db');

db.run('ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT "free"', (err) => {
    if (err && !err.message.includes('duplicate')) {
        console.error('Migration error:', err.message);
    } else {
        console.log('OK: subscription_tier column added (or already exists)');
    }
    db.close();
    process.exit(0);
});
