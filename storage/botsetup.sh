#!/bin/bash

# Anilo Admin Bot Setup Script
echo "--- Anilo Admin Bot Setup ---"

# Check if .env exists, if not, we need more info
if [ ! -f ".env" ]; then
    echo ".env fayli topilmadi. Avval setup.sh ni ishga tushiring yoki qo'lda yarating."
    exit 1
fi

# Prompt for credentials
read -p "Telegram Bot Token kiriting: " bot_token
read -p "Admin IDlarini kiriting (vergul bilan ajrating, masalan: 8021115446,8304278813): " admin_ids

# Append to .env
echo "BOT_TOKEN=$bot_token
ADMIN_IDS=$admin_ids" >> .env

# Ensure requirements are installed in venv
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
