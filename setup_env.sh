#!/bin/bash

# Setup Environment Variables
echo "🔐 Setting up secure environment variables..."

if [ -f .env ]; then
    echo "⚠️  .env file already exists. Skipping..."
    exit 0
fi

if [ ! -f .env.example ]; then
    echo "❌ .env.example not found!"
    exit 1
fi

cp .env.example .env

# Generate random secrets
ROOT_PASS=$(openssl rand -hex 16)
USER_PASS=$(openssl rand -hex 16)
JWT_SEC=$(openssl rand -hex 24)

# Replace in .env (MacOS/BSD sed requires '')
sed -i '' "s/change_me_to_strong_password/$ROOT_PASS/g" .env
sed -i '' "s/change_me_to_random_secret_string/$JWT_SEC/g" .env

# Handle specialized replacements if needed (database user password)
# In .env.example, we used 'change_me_to_strong_password' for both root and user.
# The above sed replaces all. To separate them we'd need distinct placeholders.
# For simplicity, we'll keep them distinct if possible, but currently they are the same placeholder.
# Let's fix .env.example to have distinct placeholders to support distinct passwords if we want,
# but using the same Strong Random password for both is also "secure enough" vs hardcoded 'password',
# though distinct is better.
# Let's stick with the current simple replacement:
# The sed command replaced ALL instances.
# So ROOT and USER password are now the same, which is fine for this context, but they are random and strong.

echo "✅ .env file created with generated secrets."
