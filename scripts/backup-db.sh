#!/bin/bash
# Database Backup Script for CyberCore-Blog
# Usage: ./scripts/backup-db.sh

set -e

BACKUP_DIR="./db/backups"
DB_FILE="./db/blog.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/blog_backup_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: Database file not found at $DB_FILE"
    exit 1
fi

# Backup database
echo "🔄 Backing up database..."
cp "$DB_FILE" "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo "✅ Database backed up successfully!"
echo "📁 Location: $BACKUP_FILE_COMPRESSED"
echo "📊 Size: $(ls -lh "$BACKUP_FILE_COMPRESSED" | awk '{print $5}')"

# Optional: Keep only last 7 days of backups
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "blog_backup_*.db.gz" -mtime +7 -delete

# Show backup summary
echo ""
echo "📋 Backup Summary:"
echo "   Total backups: $(ls -1 "$BACKUP_DIR" | wc -l)"
echo "   Latest 5 backups:"
ls -1 "$BACKUP_DIR" | tail -5 | sed 's/^/   - /'
