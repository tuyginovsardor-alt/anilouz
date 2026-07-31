#!/bin/bash

# Anilo Storage Setup Script
echo "--- Anilo Storage & API Setup ---"

# Load existing .env if it exists
if [ -f .env ]; then
    # Use a more robust way to load env vars
    export $(grep -v '^#' .env | xargs)
fi

# Function to prompt if not set
prompt_if_empty() {
    local var_name=$1
    local prompt_text=$2
    local current_val=${!var_name}

    if [ -z "$current_val" ]; then
        read -p "$prompt_text: " input_val
        eval "$var_name=\$input_val"
    else
        echo "$var_name allaqachon mavjud: $current_val"
        read -p "O'zgartirmoqchimisiz? (y/N): " change
        if [[ "$change" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            read -p "$prompt_text: " input_val
            eval "$var_name=\$input_val"
        fi
    fi
}

prompt_if_empty SUPABASE_URL "Supabase URL kiriting (Masalan: https://xyz.supabase.co)"
prompt_if_empty SUPABASE_SERVICE_ROLE_KEY "Supabase Service Role Key kiriting"
prompt_if_empty SERVER_IP "Server IP yoki Domain manzilini kiriting (Masalan: apibot.wentric.uz)"

# Final values
sb_url=$SUPABASE_URL
sb_key=$SUPABASE_SERVICE_ROLE_KEY
server_ip=$SERVER_IP

# Create/Update .env
echo "SUPABASE_URL=$sb_url
SUPABASE_SERVICE_ROLE_KEY=$sb_key
STORAGE_URL=https://$server_ip/films/
SERVER_IP=$server_ip" > .env

# Retain existing BOT tokens if they exist
if [ ! -z "$BOT_TOKEN" ]; then
    echo "BOT_TOKEN=$BOT_TOKEN" >> .env
fi
if [ ! -z "$ADMIN_IDS" ]; then
    echo "ADMIN_IDS=$ADMIN_IDS" >> .env
fi

# Update system
sudo apt update
sudo apt install python3-pip python3-venv caddy -y

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install wheel
pip install -r requirements.txt

# Create storage directory
mkdir -p films
chmod 777 films

# Setup Caddyfile with Domain (Automatic HTTPS)
# Get absolute path for storage
ABS_PATH=$(pwd)

echo "$server_ip {
    # Static files should be handled first
    handle_path /films/* {
        root * $ABS_PATH/films
        file_server
    }
    
    # Everything else to FastAPI
    reverse_proxy localhost:8000
}" | sudo tee /etc/caddy/Caddyfile

# Open Firewall ports
if command -v ufw > /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 8000/tcp
    sudo ufw --force enable
fi

sudo systemctl restart caddy

# Setup Systemd Service for FastAPI
echo "[Unit]
Description=Anilo Storage FastAPI Service
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
EnvironmentFile=$(pwd)/.env
ExecStart=$(pwd)/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-storage.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-storage
sudo systemctl restart anilo-storage

echo "Setup Complete! API running on http://$server_ip"
