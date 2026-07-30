#!/bin/bash

# Anilo Storage Setup Script
echo "--- Anilo Storage & API Setup ---"

# Prompt for Supabase details
read -p "Supabase URL kiriting (Masalan: https://xyz.supabase.co): " sb_url
read -p "Supabase Service Role Key kiriting: " sb_key
read -p "Server IP manzilini kiriting (DNS pishguncha): " server_ip

# Create .env
echo "SUPABASE_URL=$sb_url
SUPABASE_SERVICE_ROLE_KEY=$sb_key
STORAGE_URL=http://$server_ip/films/
SERVER_IP=$server_ip" > .env

# Update system
sudo apt update
sudo apt install python3-pip python3-venv caddy -y

# Create virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Install requirements INSIDE venv
pip install --upgrade pip
pip install wheel
pip install -r requirements.txt

# Create storage directory
mkdir -p films
chmod 777 films

# Setup Caddyfile
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
ExecStart=$(pwd)/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-storage.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-storage
sudo systemctl restart anilo-storage

echo "Setup Complete! API running on http://$server_ip"
