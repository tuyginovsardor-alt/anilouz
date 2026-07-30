#!/bin/bash

# Anilo Admin Bot Setup Script
echo "--- Anilo Admin Bot Setup ---"

# Prompt for credentials
read -p "Telegram Bot Token kiriting: " bot_token
read -p "Admin IDlarini kiriting (vergul bilan ajrating, masalan: 123,456): " admin_ids

# Append to .env
echo "BOT_TOKEN=$bot_token
ADMIN_IDS=$admin_ids" >> .env

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
sudo systemctl start anilo-bot

echo "Bot Setup Complete! Admin bot is running."
