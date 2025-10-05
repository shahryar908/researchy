# Ngrok Deployment - Setup Summary

## ✅ What Was Configured

### Files Created:
1. **[ngrok.yml](ngrok.yml)** - Ngrok tunnel configuration
2. **[start-ngrok.bat](start-ngrok.bat)** - Automated deployment script
3. **[get-ngrok-urls.js](get-ngrok-urls.js)** - URL extraction helper
4. **[package.json](package.json)** - NPM scripts for easy deployment
5. **[NGROK_DEPLOYMENT.md](NGROK_DEPLOYMENT.md)** - Complete deployment guide
6. **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide

### Files Modified:
1. **[backend/index.ts](backend/index.ts)** - Added ngrok CORS support
   ```typescript
   /\.ngrok\.io$/,    // Allow ngrok tunnels
   /\.ngrok-free\.app$/  // Allow ngrok free tier
   ```

2. **[agent/ai-researcher/main.py](agent/ai-researcher/main.py)** - Added ngrok CORS + dynamic backend URL
   ```python
   # CORS for ngrok
   "https://*.ngrok.io",
   "https://*.ngrok-free.app"

   # Dynamic backend URL
   backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")
   ```

## 🎯 How It Works

```
┌────────────────┐
│ Vercel Frontend│ (Always online)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Ngrok Tunnels  │ (Public access to local services)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Your Laptop    │ (Backend + Agent running locally)
│ - Bun          │
│ - uv Python    │
└────────────────┘
```

## 🚀 Usage

### Start Deployment:
```bash
start-ngrok.bat
```

### Get Public URLs:
```bash
node get-ngrok-urls.js
```

### Update Environment:
1. **Vercel:** `NEXT_PUBLIC_API_URL=https://xxxx.ngrok.io`
2. **Agent .env:** `BACKEND_URL=https://yyyy.ngrok.io`

### Monitor:
```bash
# Ngrok dashboard
http://localhost:4040

# Check URLs anytime
npm run urls
```

## 📊 Benefits

✅ **Instant Deployment** - No server setup needed
✅ **Public Access** - Share Vercel URL with anyone
✅ **Local Development** - Edit code and test immediately
✅ **Real Services** - Use actual Clerk, Supabase, Gemini
✅ **Request Monitoring** - See all traffic in ngrok dashboard
✅ **No Costs** - Backend/Agent run on your laptop (free ngrok tier)

## 📝 Next Steps

1. **Configure ngrok:**
   ```bash
   # Get token: https://dashboard.ngrok.com/get-started/your-authtoken
   ngrok.cmd authtoken YOUR_TOKEN

   # Edit ngrok.yml with your token
   ```

2. **Deploy:**
   ```bash
   start-ngrok.bat
   ```

3. **Get URLs:**
   ```bash
   node get-ngrok-urls.js
   ```

4. **Update Vercel + Agent env vars**

5. **Test your app!**

## 📚 Documentation

- **Quick Start:** [QUICK_START.md](QUICK_START.md) - Get running in 5 minutes
- **Full Guide:** [NGROK_DEPLOYMENT.md](NGROK_DEPLOYMENT.md) - Complete documentation
- **Project README:** [README.md](README.md) - Project overview

## 🔍 Verification

Test that everything is working:

```bash
# 1. Check ngrok authentication
ngrok.cmd config check

# 2. Check services locally
curl http://localhost:3001
curl http://localhost:8000/health

# 3. Start deployment
start-ngrok.bat

# 4. Verify tunnels
node get-ngrok-urls.js

# 5. Test public access (after updating Vercel)
curl https://your-app.vercel.app
```

## 💡 Tips

### Windows Clipboard
```bash
# Copy backend URL to clipboard
node get-ngrok-urls.js | findstr "NEXT_PUBLIC" | clip
```

### Quick Restart
```bash
# If you need to restart everything
# Close all terminal windows
start-ngrok.bat
node get-ngrok-urls.js
```

### Keep URLs Stable
- Free tier: URLs change on restart
- Paid tier ($8/mo): Static domains
- Update env vars after each restart (free tier)

## 🆘 Troubleshooting

**Issue:** Ngrok authentication error
**Fix:** `ngrok.cmd authtoken YOUR_TOKEN`

**Issue:** CORS errors
**Fix:** Verify ngrok patterns in backend/index.ts and main.py

**Issue:** Agent can't reach backend
**Fix:** Check `BACKEND_URL` in agent/.env (should be ngrok URL)

**Issue:** Vercel frontend not connecting
**Fix:** Update `NEXT_PUBLIC_API_URL` in Vercel and redeploy

---

**You're all set! 🎉**

Your AI Research Assistant can now be accessed publicly via your Vercel URL, with backend and agent running on your laptop through ngrok tunnels.
