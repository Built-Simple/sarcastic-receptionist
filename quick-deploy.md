# 🚀 Quick Deploy Commands

## One-Line Deploy to Digital Ocean

```bash
# From your local machine (replace YOUR_SERVER_IP)
scp sarcastic-receptionist-deploy.tar.gz root@YOUR_SERVER_IP:~/ && ssh root@YOUR_SERVER_IP 'tar -xzf sarcastic-receptionist-deploy.tar.gz && cd deployment-ready && ./setup-server.sh'
```

## Step-by-Step Commands

### 1. Create Deployment Package (Local)
```bash
# Make script executable
chmod +x prepare-deployment.sh

# Create deployment package
./prepare-deployment.sh
```

### 2. Upload to Server
```bash
# Upload package
scp sarcastic-receptionist-deploy.tar.gz root@YOUR_SERVER_IP:~/

# Or using a custom SSH port
scp -P 2222 sarcastic-receptionist-deploy.tar.gz root@YOUR_SERVER_IP:~/
```

### 3. Deploy on Server
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# Extract package
tar -xzf sarcastic-receptionist-deploy.tar.gz

# Navigate to directory
cd deployment-ready

# Run setup
./setup-server.sh

# Edit environment variables
nano .env
# Add your API keys:
# OPENAI_API_KEY=sk-...
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Start with PM2
```bash
# Install PM2 if not already installed
npm install -g pm2

# Start application
pm2 start ultimate-sarcastic-server-fixed.js --name sarcastic-receptionist

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Setup Nginx (if not using deploy.sh)
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/sarcastic-receptionist
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sarcastic-receptionist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d YOUR_DOMAIN.com
```

### 7. Update Twilio
1. Log into Twilio Console
2. Go to Phone Numbers > Active Numbers
3. Update webhook URL to: `https://YOUR_DOMAIN.com/incoming-call`
4. Set status callback to: `https://YOUR_DOMAIN.com/call-status`

## 🔥 Super Quick Deploy (if server is pre-configured)

```bash
# One command to rule them all
./prepare-deployment.sh && scp sarcastic-receptionist-deploy.tar.gz root@YOUR_SERVER_IP:~/ && ssh root@YOUR_SERVER_IP 'cd /var/www && rm -rf sarcastic-receptionist-old && mv sarcastic-receptionist sarcastic-receptionist-old && tar -xzf ~/sarcastic-receptionist-deploy.tar.gz && mv deployment-ready sarcastic-receptionist && cd sarcastic-receptionist && cp ../sarcastic-receptionist-old/.env . && npm ci --production && pm2 restart sarcastic-receptionist'
```

## 📱 Test Your Deployment

### Via Command Line
```bash
# Test health endpoint
curl https://YOUR_DOMAIN.com/health

# Test simple call
curl -X POST https://YOUR_DOMAIN.com/test-simple
```

### Via Web Interface
1. Visit: `https://YOUR_DOMAIN.com/`
2. Enter your phone number
3. Click "Call Receptionist"

### Via Embedded Widget
Add to any website:
```html
<script src="https://YOUR_DOMAIN.com/widget.js"></script>
<div id="sarcastic-receptionist"></div>
```

## 🛠️ Common Commands

### View Logs
```bash
pm2 logs sarcastic-receptionist
pm2 logs sarcastic-receptionist --lines 100
```

### Restart Service
```bash
pm2 restart sarcastic-receptionist
```

### Monitor Performance
```bash
pm2 monit
```

### Update Deployment
```bash
# Create new package locally
./prepare-deployment.sh

# Upload and extract
scp sarcastic-receptionist-deploy.tar.gz root@YOUR_SERVER_IP:~/
ssh root@YOUR_SERVER_IP
cd /var/www
tar -xzf ~/sarcastic-receptionist-deploy.tar.gz
cp sarcastic-receptionist/.env deployment-ready/
rm -rf sarcastic-receptionist-old
mv sarcastic-receptionist sarcastic-receptionist-old
mv deployment-ready sarcastic-receptionist
cd sarcastic-receptionist
npm ci --production
pm2 restart sarcastic-receptionist
```

## 🚨 Emergency Rollback

```bash
# If something goes wrong
cd /var/www
mv sarcastic-receptionist sarcastic-receptionist-broken
mv sarcastic-receptionist-old sarcastic-receptionist
pm2 restart sarcastic-receptionist
```

## 📋 Post-Deploy Checklist

- [ ] Environment variables configured
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] SSL certificate active
- [ ] Twilio webhooks updated
- [ ] Web interface accessible
- [ ] Test call successful
- [ ] Widget loads on test page

---

Remember: The receptionist is now live and ready to sarcastically assist your callers! 🙄📞