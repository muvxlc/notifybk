#!/bin/bash
# Package the application for migration

PACKAGE_NAME="elysia-dashboard-migration.zip"

echo "📦 Starting packaging process..."

# 1. Create a fresh backup
echo "1️⃣ Creating database backup..."
./backup.sh

if [ $? -ne 0 ]; then
    echo "❌ Backup failed! Aborting packaging."
    exit 1
fi

# 2. Create the ZIP file
echo "2️⃣ Creating ZIP archive..."

# Remove old package if exists
if [ -f "$PACKAGE_NAME" ]; then
    rm "$PACKAGE_NAME"
fi

# Create zip excluding node_modules, .git, .bun
zip -r "$PACKAGE_NAME" . \
    -x "node_modules/*" \
    -x "backend/node_modules/*" \
    -x "frontend/node_modules/*" \
    -x "frontend/dist/*" \
    -x ".git/*" \
    -x ".bun/*" \
    -x ".env" \
    -x ".DS_Store" \
    -x "**/.DS_Store"

if [ $? -eq 0 ]; then
    echo "✅ Packaging successful!"
    echo "📂 Package created: $PACKAGE_NAME"
    echo "👉 You can now copy this file to your new server."
else
    echo "❌ Packaging failed!"
    exit 1
fi
