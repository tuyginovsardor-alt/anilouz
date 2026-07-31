#!/bin/bash

# Anilo Admin Bot Setup Script
echo "--- Anilo Admin Bot Setup ---"

if [ ! -f ".env" ]; then
    echo ".env fayli topilmadi. Avval setup.sh ni ishga tushiring."
    exit 1
fi

# Load existing .env
export $(grep -v '^#' .env | xargs)

# Function to prompt if not set
prompt_if_empty() {
    local var_name=$1
    local prompt_text=$2
    local current_val=${!var_name}

    if [ -z "$current_val" ] || [ "$current_val" == "token" ] || [ "$current_val" == "123456" ]; then
        read -p "$prompt_text: " input_val
        eval "$var_name=\$input_val"
    else
        echo "✅ $var_name mavjud."
        return
    fi
}

prompt_if_empty BOT_TOKEN "Telegram Bot Token kiriting"
prompt_if_empty ADMIN_IDS "Admin IDlarini kiriting (vergul bilan)"

# Optional UserBot credentials
if [ -z "$TG_API_ID" ]; then
    read -p "Telegram API ID (ixtiyoriy, Enter bosing): " TG_API_ID
fi
if [ -z "$TG_API_HASH" ]; then
    read -p "Telegram API HASH (ixtiyoriy, Enter bosing): " TG_API_HASH
fi

# Rewrite .env with all values
echo "SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
STORAGE_URL=$STORAGE_URL
SERVER_IP=$SERVER_IP
BOT_TOKEN=$BOT_TOKEN
ADMIN_IDS=$ADMIN_IDS
TG_API_ID=$TG_API_ID
TG_API_HASH=$TG_API_HASH" > .env

# Install requirements again
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
