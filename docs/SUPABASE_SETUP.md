# Supabase Configuration Guide

## Overview

CyberCore Blog supports two database backends:
- **SQLite** (default) - Local file-based database
- **Supabase** (PostgreSQL) - Cloud-hosted database with RLS, real-time features

## Quick Start with Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Create a new project
4. Get your credentials:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: Found in Settings → API → Project API Keys
   - **Service Key**: Found in Settings → API → Project API Keys

### 2. Update `.env` File

```env
DATABASE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Database Tables

Run these SQL queries in Supabase SQL Editor (`https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new`):

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  subscription_tier TEXT DEFAULT 'free',
  reset_token TEXT,
  reset_expires BIGINT,
  failed_login_attempts INTEGER DEFAULT 0,
  lockout_until BIGINT,
  api_token TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_api_token ON users(api_token);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

#### Posts Table
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_premium INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

#### Comments Table
```sql
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

#### Login Attempts Table
```sql
CREATE TABLE login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  attempted_at BIGINT NOT NULL
);

CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

---

## Supabase Features

### Row Level Security (RLS)

Supabase supports Row Level Security to restrict data access:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can see own data"
ON users FOR SELECT
USING (auth.uid()::text = id::text);

-- Only admins can see all users
CREATE POLICY "Admins can see all users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);
```

### Real-Time Subscriptions

Listen to database changes in real-time:

```javascript
const { supabase } = require('./config/supabase');

// Subscribe to new posts
const subscription = supabase
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('New post:', payload.new);
    }
  )
  .subscribe();
```

### Backups

Supabase automatically creates daily backups. Access them in:
- Project Settings → Backups

---

## Migration from SQLite to Supabase

### Export SQLite Data

```bash
# Backup SQLite database
./scripts/backup-db.sh

# Export as SQL
sqlite3 db/blog.db .dump > backup.sql
```

### Import to Supabase

1. Create Supabase tables (see above)
2. Use Supabase SQL Editor to import data:
   ```sql
   INSERT INTO users (id, username, email, password_hash, role, api_token, created_at)
   VALUES (...);
   ```

3. Update `.env` file
4. Restart server

---

## Troubleshooting

### Connection Issues

```bash
# Test Supabase connection
curl -X POST "https://YOUR_PROJECT.supabase.co/rest/v1/users" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### RLS Blocking Access

If you see "new row violates row-level security policy":
1. Go to Supabase Dashboard
2. Authentication → Policies
3. Check policy conditions
4. Temporarily disable RLS for debugging: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Performance

For better performance with PostgreSQL:
- Enable connection pooling in Supabase
- Use PgBouncer mode for short-lived connections
- Create appropriate indexes
- Use EXPLAIN to analyze queries

---

## Deployment

### Environment Variables

For production, use environment variables (not `.env` file):

```bash
export DATABASE_TYPE=supabase
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-key
export NODE_ENV=production
```

### Using Vercel

1. Connect repository to Vercel
2. Add environment variables in project settings
3. Deploy

### Using Heroku

```bash
heroku create your-app-name
heroku config:set DATABASE_TYPE=supabase
heroku config:set SUPABASE_URL=https://your-project.supabase.co
heroku config:set SUPABASE_ANON_KEY=your-key
git push heroku main
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

ENV DATABASE_TYPE=supabase
ENV NODE_ENV=production

CMD ["npm", "start"]
```

---

## Comparison: SQLite vs Supabase

| Feature | SQLite | Supabase |
|---------|--------|----------|
| **Type** | File-based | PostgreSQL (Cloud) |
| **Scaling** | Single machine | Horizontal |
| **Concurrent Users** | Limited | Unlimited |
| **Automatic Backups** | Manual | Daily |
| **RLS** | No | Yes |
| **Real-time** | No | Yes |
| **Cost** | Free | Free tier, then $25/mo |
| **Setup** | Instant | 5 minutes |
| **Best For** | Development | Production |

---

## Useful Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase SQL Editor**: https://supabase.com/dashboard
- **Supabase API Docs**: https://supabase.com/docs/reference/rest/intro
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Support

- **Supabase Issues**: https://github.com/supabase/supabase/issues
- **Blog Project Issues**: Check GitHub repository
- **PostgreSQL Help**: https://www.postgresql.org/support/

