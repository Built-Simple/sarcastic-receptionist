# ✅ Deployment Verification Checklist

Use this checklist to verify your Sarcastic Receptionist deployment is working correctly.

## Pre-Deployment Verification

### Local Testing
- [ ] Run `npm start` locally
- [ ] Test web interface at `http://localhost:3000/`
- [ ] Make a test call through web interface
- [ ] Verify widget loads at `/embed-demo.html`
- [ ] Check health endpoint returns JSON

### Package Creation
- [ ] Run `./prepare-deployment.sh`
- [ ] Verify `sarcastic-receptionist-deploy.tar.gz` created
- [ ] Check package size is reasonable (should be < 1MB)

## Server Deployment Verification

### Initial Setup
- [ ] Package uploaded to server successfully
- [ ] Extracted without errors
- [ ] `.env` file created with all required keys:
  - [ ] `OPENAI_API_KEY` set
  - [ ] `TWILIO_ACCOUNT_SID` set
  - [ ] `TWILIO_AUTH_TOKEN` set
  - [ ] `TWILIO_PHONE_NUMBER` set
  - [ ] `PORT` set (default: 3000)

### Dependencies
- [ ] Node.js 18+ installed
- [ ] `npm ci --production` completed successfully
- [ ] No dependency warnings or errors

### Process Management
- [ ] PM2 installed globally
- [ ] Application started with PM2
- [ ] PM2 shows status as "online"
- [ ] No errors in PM2 logs

## Web Server Configuration

### Nginx
- [ ] Nginx configuration created
- [ ] Domain name properly set
- [ ] `nginx -t` passes without errors
- [ ] Nginx restarted successfully
- [ ] Port 80 accessible

### SSL Certificate
- [ ] Certbot installed
- [ ] SSL certificate obtained for domain
- [ ] HTTPS redirect configured
- [ ] Port 443 accessible
- [ ] No SSL warnings in browser

## Twilio Configuration

### Webhook Settings
- [ ] Voice webhook URL updated to `https://your-domain.com/incoming-call`
- [ ] Status callback URL set to `https://your-domain.com/call-status`
- [ ] HTTP method set to POST
- [ ] Webhook accessible from internet

### Phone Number
- [ ] Twilio phone number active
- [ ] Account has sufficient balance
- [ ] Phone number matches `.env` configuration

## Functionality Testing

### Health Check
```bash
curl https://your-domain.com/health
```
- [ ] Returns 200 OK
- [ ] Shows current mood
- [ ] Shows correct status

### Web Interface
- [ ] Visit `https://your-domain.com/`
- [ ] Page loads without errors
- [ ] No console errors in browser
- [ ] Phone input accepts numbers
- [ ] Call button is clickable

### Make Test Call
- [ ] Enter valid phone number
- [ ] Click "Call Receptionist"
- [ ] Status shows "Connecting..."
- [ ] Phone rings
- [ ] Call connects successfully
- [ ] Receptionist greets sarcastically
- [ ] Voice is clear and natural
- [ ] Call ends properly

### Widget Testing
- [ ] Visit `/embed-demo.html`
- [ ] Widget appears in bottom-right
- [ ] Click to expand works
- [ ] Can make call through widget
- [ ] Widget closes properly

### Voice Quality
- [ ] No SSML tags spoken
- [ ] Voice consistent throughout call
- [ ] Speech rate sounds natural (105%)
- [ ] Professional greeting delivered
- [ ] Sarcastic personality evident

## Performance Verification

### Response Times
- [ ] Web pages load quickly
- [ ] API endpoints respond < 1s
- [ ] No timeout errors

### Resource Usage
```bash
pm2 show sarcastic-receptionist
```
- [ ] Memory usage reasonable (< 200MB)
- [ ] CPU usage low when idle
- [ ] No memory leaks over time

## Logging and Monitoring

### Application Logs
```bash
pm2 logs sarcastic-receptionist --lines 50
```
- [ ] No error messages
- [ ] Incoming calls logged
- [ ] Status updates visible

### Interaction Logs
- [ ] `interactions.jsonl` being created
- [ ] Funny interactions logged
- [ ] Timestamps correct

### Log Rotation
- [ ] PM2 logrotate configured
- [ ] Old logs being archived
- [ ] Disk space monitored

## Security Verification

### Environment
- [ ] `.env` permissions set to 600
- [ ] No API keys in logs
- [ ] No sensitive data exposed

### Firewall
- [ ] Only required ports open (22, 80, 443)
- [ ] UFW or iptables configured
- [ ] Rate limiting considered

## Production Readiness

### Monitoring Setup
- [ ] Uptime monitoring configured
- [ ] SSL expiry monitoring
- [ ] Disk space alerts
- [ ] Error notifications

### Backup Strategy
- [ ] Configuration backed up
- [ ] Deployment documented
- [ ] Rollback plan ready

### Documentation
- [ ] Team knows deployment process
- [ ] Webhook URLs documented
- [ ] Emergency contacts listed

## Final Verification

### Complete Test Sequence
1. [ ] Make call from web interface
2. [ ] Receive sarcastic greeting
3. [ ] Have conversation
4. [ ] End call properly
5. [ ] Check logs show interaction
6. [ ] Verify no errors

### User Acceptance
- [ ] Stakeholders tested
- [ ] Sarcasm level approved
- [ ] Voice quality accepted
- [ ] Ready for public use

## Sign-off

- [ ] All checks passed
- [ ] Deployment verified working
- [ ] Documentation complete
- [ ] Ready for production traffic

---

**Deployment Verified By:** _________________  
**Date:** _________________  
**Version:** 3.4 (with Web Interface)

## If Issues Found

1. Check PM2 logs: `pm2 logs sarcastic-receptionist --err`
2. Verify environment variables: `cat .env`
3. Test webhook manually: `curl -X POST https://your-domain.com/incoming-call`
4. Check Nginx logs: `tail -f /var/log/nginx/error.log`
5. Verify Twilio console for errors

Remember: The receptionist should sound sarcastic but helpful! 🙄✅