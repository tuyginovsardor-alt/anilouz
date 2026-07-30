#!/bin/bash

# Anilo Storage Setup Script
echo "--- Anilo Storage & API Setup ---"

# Prompt for Supabase details
read -p "Supabase URL kiriting: " sb_url
read -p "Supabase Service Role Key kiriting: " sb_key
read -p "Server IP manzilini kiriting (DNS pishguncha ishlatiladi): " server_ip

# Create .env
echo "SUPABASE_URL=$sb_url
SUPABASE_SERVICE_ROLE_KEY=$sb_key
STORAGE_URL=http://$server_ip/films/
# DNS tayyor bo'lganda STORAGE_URL=https://api.anilo.uz/films/ qilib o'zgartirish mumkin" > .env

# Update system
sudo apt update
sudo apt install python3-pip python3-venv caddy -y

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Install/Update requirements
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create storage directory
mkdir -p films
chmod 777 films

# Setup Caddyfile (handling both IP and domain if possible)
echo ":80 {
    reverse_proxy localhost:8000
}" | sudo tee /etc/caddy/Caddyfile

sudo systemctl restart caddy

# Setup Systemd Service for FastAPI
echo "[Unit]
Description=Anilo Storage FastAPI Service
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
EnvironmentFile=$(pwd)/.env
ExecStart=$(pwd)/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-storage.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-storage
sudo systemctl restart anilo-storage

echo "Setup Complete! API running on http://$server_ip"
