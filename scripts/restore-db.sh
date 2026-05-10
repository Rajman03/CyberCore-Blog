#!/bin/bash
# Database Restore Script for CyberCore-Blog
# Usage: ./scripts/restore-db.sh backups/blog_backup_20260510_120000.db.gz

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: No backup file specified"
    echo ""
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -1 ./db/backups/ 2>/dev/null | sed 's/^/   - /' || echo "   No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_FILE="./db/blog.db"
TEMP_FILE="/tmp/blog_restore_$$.db"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from a backup."
echo "Current data will be lost!"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Target: $DB_FILE"
echo ""
read -p "Are you sure? Type 'yes' to confirm: " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo ""
echo "🔄 Restoring database..."

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    echo "✅ Decompressed backup"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# Backup current database
if [ -f "$DB_FILE" ]; then
    CURRENT_BACKUP="$DB_FILE.backup_$(date +%Y%m%d_%H%M%S)"
    cp "$DB_FILE" "$CURRENT_BACKUP"
    echo "💾 Current database backed up to: $CURRENT_BACKUP"
fi

# Restore database
cp "$TEMP_FILE" "$DB_FILE"
rm -f "$TEMP_FILE"

echo "✅ Database restored successfully!"
echo "📁 File: $DB_FILE"
echo "📊 Size: $(ls -lh "$DB_FILE" | awk '{print $5}')"
echo ""
echo "🚀 Please restart the server to complete the restore."
echo "   npm start"
