#!/bin/bash
# Generate Secure Keys for CyberCore-Blog
# Usage: ./scripts/generate-keys.sh

set -e

echo "🔐 Generating Secure Keys for CyberCore-Blog"
echo "=============================================="
echo ""

# Generate SECRET_KEY (32 bytes = 256 bits)
SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ SECRET_KEY (32 bytes):"
echo "   $SECRET_KEY"
echo ""

# Generate API Token prefix
API_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ API_TOKEN Sample (32 bytes):"
echo "   $API_TOKEN"
echo ""

# Generate Session Secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ SESSION_SECRET (32 bytes):"
echo "   $SESSION_SECRET"
echo ""

echo "📝 Add these to your .env file:"
echo "=============================================="
echo "SECRET_KEY=$SECRET_KEY"
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""
echo "💾 Saving to .env..."

# Backup existing .env
if [ -f .env ]; then
    BACKUP_TIME=$(date +"%Y%m%d_%H%M%S")
    cp .env ".env.backup_$BACKUP_TIME"
    echo "✅ Previous .env backed up to .env.backup_$BACKUP_TIME"
fi

# Update .env with new keys (only if they don't exist)
if ! grep -q "^SECRET_KEY=" .env 2>/dev/null; then
    echo "SECRET_KEY=$SECRET_KEY" >> .env
    echo "✅ SECRET_KEY added to .env"
else
    echo "⚠️  SECRET_KEY already exists in .env, skipping"
fi

if ! grep -q "^SESSION_SECRET=" .env 2>/dev/null; then
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env
    echo "✅ SESSION_SECRET added to .env"
else
    echo "⚠️  SESSION_SECRET already exists in .env, skipping"
fi

echo ""
echo "🎉 Done! Your secure keys have been generated."
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "   1. Never commit .env to git"
echo "   2. Keep .env file permissions: chmod 600 .env"
echo "   3. Rotate keys periodically in production"
echo "   4. For production, use environment variables, not .env file"
