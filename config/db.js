const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const argon2 = require('argon2');
const crypto = require('crypto');

const db = new sqlite3.Database(path.join(__dirname, '../db/blog.db'), (err) => {
    if (err) console.error('❌ DB Error:', err.message);
    else console.log('🛡️  Secure SQLite Engine: ONLINE');
});

const initDB = () => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            reset_token TEXT,
            reset_expires INTEGER,
            failed_login_attempts INTEGER DEFAULT 0,
            lockout_until INTEGER DEFAULT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Seed Admin
        db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
            if (!row) {
                const hash = await argon2.hash('admin123', { type: argon2.argon2id });
                db.run(`INSERT INTO users (id, username, email, password_hash, role) 
                        VALUES (?, ?, ?, ?, ?)`, [crypto.randomUUID(), 'admin', 'admin@example.com', hash, 'admin']);
                console.log('💎 Admin seeded successfully.');
            }
        });

        // Migration for existing tables
        db.run('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0', (err) => {
            // ignore error if column already exists
        });
        db.run('ALTER TABLE users ADD COLUMN lockout_until INTEGER DEFAULT NULL', (err) => {
            // ignore error if column already exists
        });
    });
};

module.exports = { db, initDB };
