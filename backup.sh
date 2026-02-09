#!/bin/bash
# Backup database to a SQL file

# Ensure backup directory exists
mkdir -p backups

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/backup_${TIMESTAMP}.sql"

echo "Backing up database to ${BACKUP_FILE}..."

docker compose exec -T mysql mariadb-dump -u root -ppassword elysia_dashboard > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful!"
    echo "File saved at: ${BACKUP_FILE}"
else
    echo "❌ Backup failed!"
fi
