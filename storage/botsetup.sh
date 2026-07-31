#!/bin/bash

# Anilo Admin Bot Setup Script
echo "--- Anilo Admin Bot Setup ---"

if [ ! -f ".env" ]; then
    echo ".env fayli topilmadi. Avval setup.sh ni ishga tushiring."
    exit 1
fi

# Load existing .env
export $(grep -v '^#' .env | xargs)

# Prompt for credentials with defaults
read -p "Telegram Bot Token kiriting [${BOT_TOKEN:-token}]: " bot_token
bot_token=${bot_token:-$BOT_TOKEN}

read -p "Admin IDlarini kiriting (vergul bilan) [${ADMIN_IDS:-123456}]: " admin_ids
admin_ids=${admin_ids:-$ADMIN_IDS}

# Rewrite .env with all values
echo "SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
STORAGE_URL=$STORAGE_URL
SERVER_IP=$SERVER_IP
BOT_TOKEN=$bot_token
ADMIN_IDS=$admin_ids" > .env

# Install requirements again just in case
source venv/bin/activate
pip install -r requirements.txt

# Setup Systemd Service for Bot
echo "[Unit]
Description=Anilo Admin Telegram Bot
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
EnvironmentFile=$(pwd)/.env
ExecStart=$(pwd)/venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-bot.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-bot
sudo systemctl restart anilo-bot

echo "Bot Setup Complete! Admin bot is running."
