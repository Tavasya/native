#!/bin/bash

# Google Cloud VM Deployment Script for Minimal Agent
# Run this script on your Google Cloud VM after uploading files

echo "🚀 Starting Minimal Agent deployment on Google Cloud VM..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and pip
echo "🐍 Installing Python 3.11..."
sudo apt install -y python3.11 python3.11-venv python3-pip

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/minimal-agent
sudo chown $(whoami):$(whoami) /opt/minimal-agent
cd /opt/minimal-agent

# Copy files (assuming they're in current directory)
echo "📋 Copying application files..."
cp ~/minimal_agent.py .
cp ~/requirements.txt .
cp ~/.env .

# Set secure permissions on .env file
chmod 600 .env

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service file
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/minimal-agent.service > /dev/null <<EOF
[Unit]
Description=LiveKit Minimal Agent
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/opt/minimal-agent
Environment=PATH=/opt/minimal-agent/venv/bin
ExecStart=/opt/minimal-agent/venv/bin/python minimal_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🔄 Enabling and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable minimal-agent
sudo systemctl start minimal-agent

# Check service status
echo "✅ Checking service status..."
sudo systemctl status minimal-agent

echo "🎉 Deployment complete!"
echo "📊 To check logs: sudo journalctl -u minimal-agent -f"
echo "🔄 To restart: sudo systemctl restart minimal-agent"
echo "⏹️ To stop: sudo systemctl stop minimal-agent"