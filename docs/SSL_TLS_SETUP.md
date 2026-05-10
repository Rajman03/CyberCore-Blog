# SSL/TLS Configuration Guide

## Option 1: Let's Encrypt (Recommended for Production)

### Using Certbot with Nginx/Apache

1. **Install Certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   # or for Apache:
   sudo apt-get install certbot python3-certbot-apache
   ```

2. **Obtain Certificate**
   ```bash
   # For Nginx
   sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
   
   # For Apache
   sudo certbot certonly --apache -d yourdomain.com -d www.yourdomain.com
   
   # For standalone (if no web server)
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

3. **Certificate Locations**
   - Private Key: `/etc/letsencrypt/live/yourdomain.com/privkey.pem`
   - Certificate: `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`

4. **Auto Renewal**
   ```bash
   # Set up auto renewal (runs twice daily)
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   
   # Check renewal test
   sudo certbot renew --dry-run
   ```

### Using Certbot with Express.js (HTTPS server)

1. **Obtain Certificate** (see above)

2. **Configure Express HTTPS**
   ```javascript
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
     cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
   };
   
   https.createServer(options, app).listen(443, () => {
     console.log('🔒 HTTPS Server running on port 443');
   });
   ```

3. **Create Systemd Service** (`/etc/systemd/system/cyberblog.service`)
   ```ini
   [Unit]
   Description=CyberCore Blog
   After=network.target
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/CyberCore-Blog
   ExecStart=/usr/bin/node server.js
   Restart=always
   Environment="NODE_ENV=production"
   
   [Install]
   WantedBy=multi-user.target
   ```

---

## Option 2: Self-Signed Certificate (Development Only)

### Generate Self-Signed Certificate

```bash
# Create certificates directory
mkdir -p ./certs

# Generate private key and certificate (valid 365 days)
openssl req -x509 -newkey rsa:4096 -nodes -out ./certs/cert.pem -keyout ./certs/key.pem -days 365 -subj "/CN=localhost"
```

### Configure Express with Self-Signed Certificate

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('🔒 HTTPS Server running on port 443 (self-signed)');
});
```

---

## Option 3: Nginx Reverse Proxy (Recommended)

### Configure Nginx

Create `/etc/nginx/sites-available/cyberblog`:

```nginx
upstream cyberblog {
    server 127.0.0.1:4823;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy
    location / {
        proxy_pass http://cyberblog;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/cyberblog /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

---

## Security Headers Verification

### Test SSL Configuration

```bash
# Using OpenSSL
openssl s_client -connect yourdomain.com:443

# Using curl
curl -I https://yourdomain.com

# Using online tools
# https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### Check HSTS Header

```bash
curl -I https://yourdomain.com | grep -i "Strict-Transport-Security"
# Should output: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Environment Configuration

### Update .env for HTTPS

```env
NODE_ENV=production
PORT=4823
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_PROXY_TRUST_HOP=1
```

### Update server.js if using direct HTTPS

```javascript
// If not using reverse proxy, add this:
if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    const fs = require('fs');
    
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    
    https.createServer(options, app).listen(443);
}
```

---

## Troubleshooting

### Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates
```

### Port Issues

```bash
# Check if port 443 is available
sudo lsof -i :443

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### HTTPS Redirect Not Working

- Verify `NODE_ENV=production` is set
- Check reverse proxy headers
- Ensure `X-Forwarded-Proto` header is passed

---

## Best Practices

✅ **DO:**
- Use HSTS header (1 year minimum)
- Enable .well-known/acme-challenge for renewals
- Monitor certificate expiration
- Use TLS 1.2 minimum
- Implement CSP headers
- Keep OpenSSL updated

❌ **DON'T:**
- Use self-signed certs in production
- Disable SSL verification
- Mix HTTP and HTTPS
- Expose private keys
- Use weak ciphers
- Ignore security warnings

---

## Useful Commands

```bash
# Renew certificates manually
sudo certbot renew --force-renewal

# Generate new private key
sudo certbot certonly --force-renewal -d yourdomain.com

# View all certificates
sudo certbot certificates

# Remove certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```
