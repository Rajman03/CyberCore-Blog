const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/blog.db');

db.serialize(() => {
    console.log('--- DATABASE ANALYSIS ---');
    db.all("SELECT name, sql FROM sqlite_master WHERE type='table'", (err, tables) => {
        console.log('--- SCHEMA ---');
        tables.forEach(t => console.log(t.sql));
        console.log('\n--- RECORDS COUNT ---');
    });
    
    db.get('SELECT COUNT(*) as c FROM users', (err, row) => console.log('Users:', row.c));
    db.get('SELECT COUNT(*) as c FROM posts', (err, row) => console.log('Posts:', row.c));
    db.get('SELECT COUNT(*) as c FROM sessions', (err, row) => console.log('Sessions:', row.c));
    
    db.all('SELECT id, username, email, role, api_token FROM users', (err, rows) => {
        console.log('\n--- USERS ---');
        console.table(rows);
    });
});
