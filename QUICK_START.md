# 🚀 Quick Start - Ngrok Deployment

Get your AI Research Assistant running with public access in 5 minutes!

## ⚡ Super Quick Setup

### 1. Get Ngrok Token (30 seconds)
```bash
# Visit: https://dashboard.ngrok.com/get-started/your-authtoken
# Copy your token, then run:
ngrok.cmd authtoken YOUR_NGROK_AUTH_TOKEN
```

### 2. Update ngrok.yml (30 seconds)
```bash
# Open: ngrok.yml
# Replace: YOUR_NGROK_AUTH_TOKEN with your actual token
```

### 3. Deploy Everything (10 seconds)
```bash
# Windows - One command!
start-ngrok.bat

# Wait 10 seconds for services to start
```

### 4. Get Public URLs (10 seconds)
```bash
node get-ngrok-urls.js
```

### 5. Update Vercel (2 minutes)
```bash
# Copy the backend URL from step 4
# Go to: https://vercel.com/dashboard
# Your Project → Settings → Environment Variables
# Add/Update: NEXT_PUBLIC_API_URL = https://xxxx.ngrok.io
# Redeploy (automatic if git connected)
```

### 6. Update Agent .env (1 minute)
```bash
# Edit: agent/ai-researcher/.env
# Add: BACKEND_URL=https://yyyy.ngrok.io
# Save and restart agent window (Ctrl+C, then uv run main.py)
```

### 7. Test! (30 seconds)
```bash
# Visit your Vercel URL
# Sign in and start chatting!
# Monitor: http://localhost:4040
```

## 📋 Checklist

Before you start:
- [ ] ngrok installed (`ngrok.cmd version`)
- [ ] Bun installed (`bun --version`)
- [ ] uv installed (`uv --version`)
- [ ] Frontend deployed on Vercel
- [ ] All .env files configured

## 🎯 Common Commands

```bash
# Get current ngrok URLs
npm run urls

# View ngrok dashboard
# Open: http://localhost:4040

# Restart services
# Close terminals and run: start-ngrok.bat
```

## 🐛 Quick Fixes

**Ngrok won't start?**
```bash
ngrok.cmd config check
# If error, run: ngrok.cmd authtoken YOUR_TOKEN
```

**Can't connect?**
- Check CORS updated in backend/index.ts
- Check CORS updated in agent/ai-researcher/main.py
- Verify services running (localhost:3001, localhost:8000)

**URLs keep changing?**
- This is normal on free tier
- Upgrade to paid for static domains ($8/mo)
- Or update env vars after each restart

## 📖 Full Documentation

See [NGROK_DEPLOYMENT.md](NGROK_DEPLOYMENT.md) for complete guide.

---

**That's it! Your app is now publicly accessible! 🎉**
