#!/bin/bash

# Anilo Storage Setup Script
echo "Starting Anilo Storage Setup..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3-pip python3-venv caddy -y

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create storage directory
mkdir -p films

# Setup Caddyfile
echo "api.anilo.uz {
    reverse_proxy localhost:8000
}" | sudo tee /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy

# Setup Systemd Service for FastAPI
echo "[Unit]
Description=Anilo Storage FastAPI Service
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target" | sudo tee /etc/systemd/system/anilo-storage.service

sudo systemctl daemon-reload
sudo systemctl enable anilo-storage
sudo systemctl start anilo-storage

echo "Setup Complete! Backend running on http://api.anilo.uz"
