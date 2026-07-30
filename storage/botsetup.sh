#!/bin/bash

# Anilo Admin Bot Setup Script
echo "Starting Anilo Admin Bot Setup..."

# Setup Systemd Service for Bot
echo "[Unit]
Description=Anilo Admin Telegram Bot
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-bot.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-bot
sudo systemctl start anilo-bot

echo "Bot Setup Complete! Admin bot is now running."
