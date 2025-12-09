#!/bin/bash

# Sarcastic Receptionist Deployment Script for Digital Ocean
# This script deploys the application to a Digital Ocean droplet

set -e  # Exit on error

# Configuration
REMOTE_USER="root"
REMOTE_HOST="your-droplet-ip"
REMOTE_DIR="/var/www/sarcastic-receptionist"
APP_NAME="sarcastic-receptionist"
DOMAIN="your-domain.com"

echo "🚀 Starting deployment of Sarcastic Receptionist..."

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
mkdir -p deploy-temp
cp ultimate-sarcastic-server-fixed.js deploy-temp/
cp voice-enhancement-fixed.js deploy-temp/
cp personality-config.js deploy-temp/
cp sound-effects.js deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp .env.example deploy-temp/

# Step 2: Transfer files to server
echo "📤 Transferring files to server..."
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"
scp -r deploy-temp/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

# Step 3: Install dependencies and setup on server
echo "🔧 Setting up application on server..."
ssh $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
cd /var/www/sarcastic-receptionist

# Install Node.js 18 if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit /var/www/sarcastic-receptionist/.env with your API keys!"
fi

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Setup PM2
echo "Setting up PM2..."
pm2 delete sarcastic-receptionist || true
pm2 start ultimate-sarcastic-server-fixed.js --name sarcastic-receptionist
pm2 save
pm2 startup systemd -u root --hp /root

# Setup Nginx if not already configured
if [ ! -f /etc/nginx/sites-available/sarcastic-receptionist ]; then
    echo "Setting up Nginx..."
    
    # Install Nginx if not already installed
    if ! command -v nginx &> /dev/null; then
        apt-get update
        apt-get install -y nginx
    fi
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/sarcastic-receptionist << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

    # Enable the site
    ln -s /etc/nginx/sites-available/sarcastic-receptionist /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
fi

echo "✅ Deployment complete!"
echo "🔒 Next steps:"
echo "1. Edit /var/www/sarcastic-receptionist/.env with your API keys"
echo "2. Update domain in Nginx config: /etc/nginx/sites-available/sarcastic-receptionist"
echo "3. Setup SSL with: certbot --nginx -d your-domain.com"
echo "4. Update Twilio webhook to: https://your-domain.com/incoming-call"
echo "5. Monitor logs with: pm2 logs sarcastic-receptionist"

ENDSSH

# Cleanup
echo "🧹 Cleaning up..."
rm -rf deploy-temp

echo "🎉 Deployment script completed!"
echo "📱 Don't forget to update your Twilio webhook URL!"