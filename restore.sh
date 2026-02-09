#!/bin/bash
# Restore database from a SQL file

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.sql>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File ${BACKUP_FILE} not found!"
    exit 1
fi

echo "Restoring database from ${BACKUP_FILE}..."
echo "WARNING: This will overwrite the current database!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

cat "${BACKUP_FILE}" | docker compose exec -T mysql mariadb -u root -ppassword elysia_dashboard

if [ $? -eq 0 ]; then
    echo "✅ Restore successful!"
else
    echo "❌ Restore failed!"
fi
