# Ngrok Deployment Guide - Researchy

Deploy your AI Research Assistant locally with public access via ngrok tunnels.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Vercel (Production Frontend)           │
│  https://your-app.vercel.app            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Ngrok Tunnels (Public Access)          │
│  - Backend:  https://xxx.ngrok.io       │
│  - Agent:    https://yyy.ngrok.io       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Your Laptop (Local Services)           │
│  - Backend:  bun (port 3001)            │
│  - Agent:    uv python (port 8000)      │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- ✅ ngrok installed (v3.25.1+)
- ✅ ngrok account & auth token ([Get it here](https://dashboard.ngrok.com/get-started/your-authtoken))
- ✅ Bun runtime
- ✅ Python with uv package manager
- ✅ Frontend deployed on Vercel

## 🚀 Quick Start

### 1. Initial Setup (One-Time)

#### Get Ngrok Auth Token
```bash
# Visit: https://dashboard.ngrok.com/get-started/your-authtoken
# Copy your auth token, then run:
ngrok.cmd authtoken YOUR_NGROK_AUTH_TOKEN
```

#### Update ngrok.yml
```bash
# Edit ngrok.yml in project root
# Replace YOUR_NGROK_AUTH_TOKEN with your actual token
```

#### Install Dependencies
```bash
# Install axios for URL helper script
npm install
```

### 2. Deploy with Ngrok

#### Option A: Automated (Recommended)
```bash
# Windows
start-ngrok.bat

# This will:
# - Start ngrok tunnels
# - Start Bun backend
# - Start Python agent with uv
```

#### Option B: Manual
```bash
# Terminal 1: Start ngrok
ngrok.cmd start --all --config ngrok.yml

# Terminal 2: Start backend
cd backend
bun run dev

# Terminal 3: Start agent
cd agent/ai-researcher
uv run main.py
```

### 3. Get Public URLs

```bash
# Run this after services start (wait ~10 seconds)
node get-ngrok-urls.js
```

This will display:
- 📦 Backend ngrok URL
- 🤖 Agent ngrok URL
- 📝 Environment variables to update

### 4. Update Environment Variables

#### Vercel (Frontend)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Update/Add:
   ```env
   NEXT_PUBLIC_API_URL=https://xxxx.ngrok.io
   ```
4. Redeploy (automatic if git connected)

#### Agent (.env file)
```bash
# Edit: agent/ai-researcher/.env
BACKEND_URL=https://yyyy.ngrok.io  # Your backend ngrok URL
```

#### Restart Agent
```bash
# Press Ctrl+C in Agent terminal, then:
cd agent/ai-researcher
uv run main.py
```

### 5. Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Sign in with Clerk
3. Send a test message
4. Monitor requests: `http://localhost:4040`

## 📊 Monitoring

### Ngrok Dashboard
- URL: http://localhost:4040
- View all incoming requests
- Inspect request/response details
- Monitor tunnel status

### Service Logs
- **Backend**: Check the "Backend (Bun)" terminal window
- **Agent**: Check the "Agent (uv)" terminal window
- **Ngrok**: Check the "Ngrok Tunnels" window

## 🛠️ NPM Scripts

```bash
# Start ngrok tunnels only
npm run ngrok

# Get current ngrok URLs
npm run urls

# Start backend only
npm run backend

# Start agent only
npm run agent

# Full deployment (Windows)
npm run deploy
```

## 🔧 Configuration Files

### ngrok.yml
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN

tunnels:
  backend:
    proto: http
    addr: 3001

  agent:
    proto: http
    addr: 8000
```

### Environment Variables

**Vercel:**
```env
NEXT_PUBLIC_API_URL=https://xxxx.ngrok.io
```

**agent/ai-researcher/.env:**
```env
GOOGLE_API_KEY=xxx
SUPABASE_URL=xxx
SUPABASE_SERVICE_KEY=xxx
BACKEND_URL=https://yyyy.ngrok.io
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Ngrok dashboard shows 2 active tunnels
- [ ] Backend ngrok URL returns JSON response
- [ ] Agent ngrok URL shows FastAPI docs
- [ ] Vercel frontend loads without errors
- [ ] Can sign in with Clerk
- [ ] Can send chat messages
- [ ] Can generate research papers
- [ ] Can download PDFs from library

## 🐛 Troubleshooting

### Ngrok Not Starting
```bash
# Check if ngrok is authenticated
ngrok.cmd config check

# Re-authenticate
ngrok.cmd authtoken YOUR_TOKEN
```

### CORS Errors
- Verify ngrok domains in backend CORS (`backend/index.ts`)
- Verify ngrok domains in agent CORS (`agent/ai-researcher/main.py`)
- Both files should include: `https://*.ngrok.io` and `https://*.ngrok-free.app`

### Connection Refused
```bash
# Check if services are running
# Backend should be on: http://localhost:3001
# Agent should be on: http://localhost:8000

# Test locally first
curl http://localhost:3001
curl http://localhost:8000/health
```

### Agent Can't Reach Backend
- Check `BACKEND_URL` in agent/.env
- Should be the ngrok URL, not localhost
- Restart agent after updating .env

### URLs Change on Restart
- Free ngrok tier generates new URLs each time
- Upgrade to paid plan for static domains
- Or update env vars after each restart

## 💡 Tips & Best Practices

### Quick URL Copy (Windows)
```bash
# Copy backend URL to clipboard
node get-ngrok-urls.js | findstr "NEXT_PUBLIC" | clip
```

### Keep Services Running
- Don't close terminal windows
- Use Windows Task Manager to monitor processes
- Laptop must stay on and connected to internet

### Update Vercel Quickly
```bash
# If using Vercel CLI
vercel env add NEXT_PUBLIC_API_URL production
# Paste your ngrok URL when prompted
vercel --prod
```

### Save URLs for Session
```bash
# Create a session file
node get-ngrok-urls.js > session-urls.txt
```

## 🔄 Restart Services

### Restart Everything
```bash
# Close all terminal windows
# Run: start-ngrok.bat
# Update env vars
```

### Restart Backend Only
```bash
# In Backend terminal: Ctrl+C
cd backend
bun run dev
```

### Restart Agent Only
```bash
# In Agent terminal: Ctrl+C
cd agent/ai-researcher
uv run main.py
```

### Restart Ngrok Only
```bash
# In Ngrok terminal: Ctrl+C
ngrok.cmd start --all --config ngrok.yml
# Update all env vars (URLs will change)
```

## 📈 Upgrade Options

### Ngrok Free vs Paid

**Free Tier:**
- ✅ 1 online ngrok process
- ✅ 4 tunnels per process
- ✅ 40 connections/minute
- ❌ Random URLs (change on restart)
- ❌ Ngrok branding on error pages

**Paid Tier ($8/mo):**
- ✅ Static domains (same URL always)
- ✅ Custom domains
- ✅ More bandwidth
- ✅ Remove ngrok branding
- ✅ IP restrictions

[Upgrade here](https://dashboard.ngrok.com/billing/plan)

### Static Domain Setup (Paid)
```yaml
# ngrok.yml with static domains
tunnels:
  backend:
    proto: http
    addr: 3001
    domain: researchy-backend.ngrok-free.app

  agent:
    proto: http
    addr: 8000
    domain: researchy-agent.ngrok-free.app
```

## 🚫 Limitations

⚠️ **Not for Production**
- Laptop must be running
- Not suitable for high traffic
- Limited by laptop resources
- URLs change on free tier

⚠️ **Use Cases**
- ✅ Development & testing
- ✅ Demos & presentations
- ✅ Sharing with beta testers
- ✅ Portfolio showcases
- ❌ Production deployment

## 📚 Additional Resources

- [Ngrok Documentation](https://ngrok.com/docs)
- [Ngrok Dashboard](https://dashboard.ngrok.com)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Project README](README.md)

## 🆘 Support

If you encounter issues:
1. Check ngrok dashboard: http://localhost:4040
2. Review service logs in terminal windows
3. Verify environment variables are correct
4. Check firewall/antivirus settings
5. Restart all services

---

**Happy Deploying! 🚀**

Share your Vercel URL to showcase your AI Research Assistant to the world!
