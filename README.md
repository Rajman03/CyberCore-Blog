# 🛡️ CyberCore Blog - Secure Blog Platform

A production-ready, security-focused blog platform built with Express.js and featuring support for both SQLite (local) and Supabase (PostgreSQL) databases.

## ✨ Features

- 🔐 **Security First** - Multiple layers of protection (Rate limiting, Brute force protection, CSP, etc.)
- 🗄️ **Flexible Database** - Choose between SQLite or Supabase (PostgreSQL)
- 👥 **User Management** - Admin, Premium, and Free tier support
- 💳 **Stripe Integration** - Premium paywall system
- 📝 **Blog Posts** - Create, read, update, delete posts
- 💬 **Comments System** - Discuss posts with other users
- 🔑 **API Authentication** - Session-based and Token-based auth
- 📊 **Logging & Monitoring** - Security event logging and analytics
- 🎯 **Input Validation** - Joi schema validation
- 🧼 **XSS Protection** - HTML sanitization
- 🚀 **Rate Limiting** - Per-endpoint rate limiting
- 🔒 **HTTPS Support** - SSL/TLS configuration guides

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/Rajman03/CyberCore-Blog.git
cd CyberCore-Blog

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate secure keys
./scripts/generate-keys.sh

# Start server
npm start
```

Server will run at `http://localhost:4823`

### Configuration

Edit `.env` file and set your configuration:

```env
DATABASE_TYPE=sqlite           # or 'supabase'
PORT=4823
NODE_ENV=development          # 'development' or 'production'
SECRET_KEY=your-secret-key    # Change in production!
ALLOWED_ORIGINS=http://localhost:3000
```

For **production**, see [SECURITY.md](SECURITY.md).

## 🗄️ Database Setup

### SQLite (Default)

- No setup needed, database is created automatically
- Located at `./db/blog.db`

### Supabase (PostgreSQL)

1. Create account at [supabase.com](https://supabase.com)
2. Set environment variables:
   ```env
   DATABASE_TYPE=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
3. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed setup

## 📚 API Endpoints

### Authentication

```bash
# Register
POST /auth/register
{
  "username": "user",
  "email": "user@example.com",
  "password": "SecurePass123"
}

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

# Get current user
GET /auth/me (Requires auth)

# Logout
POST /auth/logout
```

### Posts

```bash
# Get all posts
GET /api/posts?page=1&limit=20

# Get single post
GET /api/posts/:id

# Create post (Admin only)
POST /api/posts
{
  "title": "Post Title",
  "content": "Post content...",
  "is_premium": false
}

# Delete post (Admin only)
DELETE /api/posts/:id
```

### Comments

```bash
# Get comments for post
GET /api/comments/posts/:postId?page=1&limit=20

# Create comment
POST /api/comments
{
  "post_id": 1,
  "content": "Great post!"
}
```

### Premium/Paywall

```bash
# Get premium articles
GET /api/paywall/articles

# Get article (requires premium)
GET /api/paywall/article/:id

# Create checkout session
POST /api/paywall/create-checkout-session
```

## 🔐 Security Features

### Implemented

- ✅ CORS with whitelist
- ✅ Content Security Policy (CSP)
- ✅ Rate limiting (100 req/15min global, 10 req/15min auth)
- ✅ Brute force protection
- ✅ Password hashing (Argon2id)
- ✅ XSS protection (HTML sanitization)
- ✅ SQL injection prevention (Parameterized queries)
- ✅ HTTPS enforcement (production)
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Input validation (Joi)
- ✅ Session management
- ✅ API token security

### See [SECURITY.md](SECURITY.md) for complete details

## 📖 Documentation

- **[SECURITY.md](SECURITY.md)** - Security configuration and checklist
- **[docs/SSL_TLS_SETUP.md](docs/SSL_TLS_SETUP.md)** - HTTPS/SSL setup guides
- **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** - Supabase configuration

## 🛠️ Development

### Development Server

```bash
npm run dev
```

Auto-reloads on file changes using nodemon.

### Database Backups

```bash
# Backup SQLite database
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh backups/blog_backup_20260510_120000.db.gz

# Generate secure keys
./scripts/generate-keys.sh
```

### Project Structure

```
├── config/              # Database configuration
│   ├── db.js           # SQLite setup
│   └── supabase.js     # Supabase setup
├── middleware/          # Express middleware
│   ├── auth.js         # Authentication
│   ├── bruteforce.js   # Brute force protection
│   ├── sanitize.js     # XSS protection
│   ├── validation.js   # Input validation (Joi)
│   ├── logger.js       # Security logging
│   └── csrf.js         # CSRF protection
├── routes/              # API routes
│   ├── auth.js         # Auth endpoints
│   ├── posts.js        # Posts endpoints
│   ├── comments.js     # Comments endpoints
│   ├── profile.js      # User profile
│   ├── users.js        # User management (admin)
│   └── paywall.js      # Premium content
├── public/              # Static files (HTML, CSS, JS)
├── scripts/             # Utility scripts
├── logs/                # Security logs
└── server.js            # Main app file
```

## 🧪 Testing

```bash
# Manual testing with curl
curl -X GET http://localhost:4823/api/posts

# Test authentication
curl -X POST http://localhost:4823/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 🚀 Deployment

### Production Checklist

See [SECURITY.md](SECURITY.md) → "Checklist Bezpieczeństwa dla Produkcji"

Key steps:
1. Set `NODE_ENV=production`
2. Generate strong `SECRET_KEY`
3. Configure `ALLOWED_ORIGINS`
4. Setup HTTPS/SSL certificate
5. Configure database (Supabase recommended)
6. Setup monitoring and logging

### Recommended Deployment Platforms

- **Vercel** - Easy GitHub integration
- **Heroku** - Simple deployment
- **Railway** - Modern platform
- **AWS** - Full control
- **DigitalOcean** - VPS option

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please follow existing code style.

## 🐛 Security Issues

Found a security issue? Email `security@yourdomain.com` (Configure in SECURITY.md)

## 📞 Support

- 📖 [Documentation](docs/)
- 🔐 [Security Guide](SECURITY.md)
- 💾 [Database Setup](docs/SUPABASE_SETUP.md)
- 🔗 [SSL/TLS Setup](docs/SSL_TLS_SETUP.md)

---

**Made with ❤️ for secure web development**
