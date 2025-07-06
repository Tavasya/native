# Minimal Agent Google Cloud VM Deployment

## Quick Setup

You need 3 files on your Google Cloud VM:
- `minimal_agent.py`
- `.env` 
- `requirements.txt`

## Step 1: Create Google Cloud VM

```bash
# Create VM instance
gcloud compute instances create minimal-agent-vm \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=e2-medium \
    --zone=us-central1-a \
    --tags=http-server,https-server

# Get external IP
gcloud compute instances describe minimal-agent-vm --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## Step 2: Upload Files to VM

```bash
# Copy files to VM (replace YOUR_VM_IP)
scp minimal_agent.py .env requirements.txt YOUR_USERNAME@YOUR_VM_IP:~/

# Or use gcloud
gcloud compute scp minimal_agent.py .env requirements.txt minimal-agent-vm:~/ --zone=us-central1-a
```

## Step 3: SSH and Deploy

```bash
# SSH into VM
gcloud compute ssh minimal-agent-vm --zone=us-central1-a

# Or regular SSH
ssh YOUR_USERNAME@YOUR_VM_IP
```

## Step 4: Run Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Create app directory
sudo mkdir -p /opt/minimal-agent
sudo chown $(whoami):$(whoami) /opt/minimal-agent
cd /opt/minimal-agent

# Copy files
cp ~/minimal_agent.py ~/requirements.txt ~/.env .
chmod 600 .env

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Test run (optional)
python minimal_agent.py
```

## Step 5: Create Service (Auto-start)

```bash
# Create systemd service
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

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable minimal-agent
sudo systemctl start minimal-agent

# Check status
sudo systemctl status minimal-agent
```

## Management Commands

```bash
# View logs
sudo journalctl -u minimal-agent -f

# Restart service
sudo systemctl restart minimal-agent

# Stop service
sudo systemctl stop minimal-agent

# Check if running
sudo systemctl is-active minimal-agent
```

## Security Notes

- `.env` file contains API keys - keep permissions at 600
- Consider using Google Secret Manager for production
- VM only needs outbound internet access for LiveKit/APIs

## Troubleshooting

```bash
# Check Python version
python3.11 --version

# Test virtual environment
source /opt/minimal-agent/venv/bin/activate
python -c "import livekit"

# Check service logs
sudo journalctl -u minimal-agent --since "1 hour ago"
```

## VM Specs Recommended

- **Machine Type**: e2-medium (2 vCPU, 4GB RAM)
- **Disk**: 20GB standard persistent disk
- **OS**: Ubuntu 22.04 LTS
- **Network**: Allow HTTP/HTTPS traffic (if needed)

The agent will automatically connect to your LiveKit server using the credentials in the `.env` file.