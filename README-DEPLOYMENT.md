# 🚀 Sarcastic Receptionist Production Deployment Guide

## Prerequisites

- Digital Ocean Droplet (Ubuntu 22.04 recommended)
- Domain name pointed to your droplet
- SSH access to your server
- Twilio account with phone number

## Step-by-Step Deployment Instructions

### 1. Prepare Your Local Environment

```bash
# Clone the repository (if not already done)
git clone your-repo-url
cd deadpool-receptionist

# Make deploy script executable
chmod +x deploy.sh

# Edit deploy.sh to add your server details
nano deploy.sh
# Update: REMOTE_HOST="your-droplet-ip"
# Update: DOMAIN="your-domain.com"
```

### 2. Initial Server Setup (One-time)

SSH into your Digital Ocean droplet:

```bash
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl git build-essential

# Create application directory
mkdir -p /var/www/sarcastic-receptionist
```

### 3. Deploy the Application

From your local machine:

```bash
# Run the deployment script
./deploy.sh
```

### 4. Configure Environment Variables

On the server:

```bash
cd /var/www/sarcastic-receptionist
nano .env
```

Add your actual API keys:
```env
OPENAI_API_KEY=sk-your-actual-openai-key
TWILIO_ACCOUNT_SID=ACyour-actual-twilio-sid
TWILIO_AUTH_TOKEN=your-actual-twilio-token
PORT=3000
```

### 5. Setup Nginx with Your Domain

```bash
# Edit Nginx configuration
nano /etc/nginx/sites-available/sarcastic-receptionist

# Replace 'your-domain.com' with your actual domain
# Save and exit

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Follow the prompts to configure SSL
```

### 7. Configure PM2 Process Management

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs sarcastic-receptionist

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Save PM2 configuration
pm2 save
```

### 8. Update Twilio Webhooks

1. Log into your Twilio Console
2. Navigate to Phone Numbers > Manage > Active Numbers
3. Click on your phone number
4. Update the Voice webhook URL to: `https://your-domain.com/incoming-call`
5. Set HTTP method to: POST
6. Add status callback URL: `https://your-domain.com/call-status`
7. Save the configuration

### 9. Test Your Deployment

```bash
# Test health endpoint
curl https://your-domain.com/health

# Check PM2 logs for any errors
pm2 logs sarcastic-receptionist

# Make a test call to your Twilio number
```

## 🔧 Maintenance Commands

### View Logs
```bash
# Real-time logs
pm2 logs sarcastic-receptionist

# Last 100 lines
pm2 logs sarcastic-receptionist --lines 100

# View interaction logs
tail -f /var/www/sarcastic-receptionist/interactions.jsonl
```

### Restart Application
```bash
pm2 restart sarcastic-receptionist
```

### Update Application
```bash
cd /var/www/sarcastic-receptionist
git pull origin main  # If using git
npm ci --production
pm2 restart sarcastic-receptionist
```

### Monitor Resources
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

## 🛡️ Security Best Practices

1. **Firewall Configuration**
```bash
# Setup UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

2. **Secure Environment Variables**
```bash
# Set proper permissions
chmod 600 /var/www/sarcastic-receptionist/.env
```

3. **Regular Updates**
```bash
# Update system packages
apt update && apt upgrade -y

# Update Node.js dependencies
npm audit fix
```

## 📊 Monitoring Tips

### 1. Setup Health Check Monitoring
Use services like UptimeRobot or Pingdom to monitor:
- `https://your-domain.com/health`
- Expected response: 200 OK with JSON status

### 2. Log Analysis
```bash
# Find funny interactions
grep "wasHilarious" interactions.jsonl | jq '.'

# Count daily calls
grep "$(date +%Y-%m-%d)" interactions.jsonl | wc -l
```

### 3. Performance Monitoring
```bash
# PM2 metrics
pm2 show sarcastic-receptionist

# Memory usage
pm2 describe sarcastic-receptionist | grep memory
```

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs sarcastic-receptionist --err

# Verify environment variables
node -e "console.log(process.env.OPENAI_API_KEY ? 'Set' : 'Not set')"

# Check port availability
netstat -tlnp | grep 3000
```

### Twilio Webhook Errors
1. Verify SSL certificate is valid
2. Check Nginx is running: `systemctl status nginx`
3. Test webhook manually: `curl -X POST https://your-domain.com/incoming-call`

### Voice Issues
1. Check OpenAI API key is valid
2. Verify Twilio account has sufficient balance
3. Review voice-enhancement-fixed.js for any errors

## 📱 Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Twilio webhooks updated
- [ ] PM2 process running
- [ ] Nginx configured and running
- [ ] Firewall rules applied
- [ ] Health monitoring setup
- [ ] Log rotation configured
- [ ] Backup strategy in place

## 🎉 Success Indicators

When everything is working correctly:
- Health endpoint returns proper status
- Incoming calls trigger sarcastic greetings
- Logs show interaction entries
- No errors in PM2 logs
- Voice maintains consistency throughout calls

## 📞 Support

For issues:
1. Check PM2 logs first
2. Verify all environment variables
3. Test each component individually
4. Review Twilio webhook logs in console