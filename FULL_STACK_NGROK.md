# 🚀 Full Stack Ngrok Deployment - Researchy

Deploy your entire AI Research Assistant (Frontend + Backend + Agent) with public access via ngrok.

## ✅ What's New

Your ngrok deployment now includes **ALL 3 services**:
- 🎨 **Frontend** (Next.js on port 3000)
- 📦 **Backend** (Bun on port 3001)
- 🤖 **Agent** (Python/uv on port 8000)

No Vercel needed! Everything runs on your laptop with public ngrok URLs.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Internet Users                         │
│  (Anyone can access your app!)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Ngrok Tunnels (3 Public URLs)          │
│  Frontend:  https://xxx.ngrok.io        │
│  Backend:   https://yyy.ngrok.io        │
│  Agent:     https://zzz.ngrok.io        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Your Laptop (All Services Local)       │
│  - Next.js Frontend (3000)              │
│  - Bun Backend (3001)                   │
│  - Python Agent (8000)                  │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Deploy All Services
```bash
start-ngrok.bat
```

This starts:
- ✅ 3 ngrok tunnels
- ✅ Backend (Bun)
- ✅ Agent (Python/uv)
- ✅ Frontend (Next.js)

Wait 15-20 seconds for initialization.

### 2. Get Public URLs
```bash
node get-ngrok-urls.js
```

You'll see:
```
🎨 Frontend (Next.js):
   https://abc123.ngrok.io
   👆 Share this URL - this is your public app!

📦 Backend (Bun):
   https://def456.ngrok.io

🤖 Agent (Python):
   https://ghi789.ngrok.io
```

### 3. Update Environment Variables

#### Frontend (.env.local)
```bash
# Edit: frontend/.env.local
NEXT_PUBLIC_API_URL=https://def456.ngrok.io  # Backend ngrok URL
```

#### Agent (.env)
```bash
# Edit: agent/ai-researcher/.env
BACKEND_URL=https://def456.ngrok.io  # Backend ngrok URL
```

### 4. Restart Services

**Frontend:**
```bash
# In Frontend window: Ctrl+C
cd frontend
npm run dev
```

**Agent:**
```bash
# In Agent window: Ctrl+C
cd agent/ai-researcher
uv run main.py
```

### 5. Access Your App! 🎉

Visit the **Frontend ngrok URL** in your browser:
```
https://abc123.ngrok.io
```

Share this URL with anyone - they can now use your AI Research Assistant!

## 📊 Monitoring

### Ngrok Dashboard
- URL: http://localhost:4040
- View all 3 tunnels
- Monitor incoming requests in real-time
- Inspect request/response details

### Service Status
Check if all services are running:
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3001

# Agent
curl http://localhost:8000/health
```

## 🔧 Configuration Files

### ngrok.yml (Already Configured!)
```yaml
version: "2"
authtoken: cr_33fASVtJti019gKKUXTb4fFBSXo

tunnels:
  frontend:
    proto: http
    addr: 3000

  backend:
    proto: http
    addr: 3001

  agent:
    proto: http
    addr: 8000
```

### Environment Variables Template

**frontend/.env.local:**
```env
# Clerk (your existing keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend URL (update with ngrok URL)
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND.ngrok.io
```

**agent/ai-researcher/.env:**
```env
# Your existing keys
GOOGLE_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...

# Backend URL (update with ngrok URL)
BACKEND_URL=https://YOUR_BACKEND.ngrok.io
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] 3 terminal windows are open (Ngrok, Backend, Agent, Frontend)
- [ ] Ngrok dashboard shows 3 active tunnels
- [ ] Frontend ngrok URL loads the app
- [ ] Can sign in with Clerk
- [ ] Can send chat messages
- [ ] Can generate research papers
- [ ] Can download PDFs

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend
**Issue:** CORS errors or API not reachable

**Fix:**
1. Check `frontend/.env.local` has correct backend ngrok URL
2. Restart frontend: `Ctrl+C` then `npm run dev`
3. Verify backend CORS includes ngrok patterns (already configured)

### Agent Can't Reach Backend
**Issue:** Agent errors when loading conversation history

**Fix:**
1. Check `agent/ai-researcher/.env` has `BACKEND_URL`
2. Should be backend ngrok URL (not localhost)
3. Restart agent: `Ctrl+C` then `uv run main.py`

### Ngrok URLs Change
**Issue:** URLs change after restart

**Solution:**
- Free tier generates new URLs each time
- Update `.env` files with new URLs after each restart
- Restart frontend and agent
- Or upgrade to paid plan for static domains

### Services Not Starting
**Issue:** Port already in use

**Fix:**
```bash
# Check what's using ports
netstat -ano | findstr "3000"
netstat -ano | findstr "3001"
netstat -ano | findstr "8000"

# Kill processes if needed
taskkill /PID <process_id> /F
```

## 💡 Tips & Tricks

### Quick URL Copy
```bash
# Copy frontend URL to clipboard
node get-ngrok-urls.js | findstr "ngrok.io" | head -1 | clip
```

### Save Session URLs
```bash
# Save current URLs for reference
node get-ngrok-urls.js > session-urls.txt
```

### Auto-Restart on .env Change
```bash
# Use nodemon for frontend (optional)
npm install -g nodemon
nodemon --watch .env.local --exec "npm run dev"
```

## 🎯 Use Cases

✅ **Perfect For:**
- Demos and presentations
- Portfolio showcases
- Beta testing with friends
- Temporary public access
- Development testing

❌ **Not Suitable For:**
- Production deployment
- High traffic applications
- Always-on services
- When laptop needs to sleep

## 📈 Upgrade Options

### Static Domains (Ngrok Paid - $8/mo)
```yaml
# ngrok.yml with static domains
tunnels:
  frontend:
    domain: my-app.ngrok-free.app  # Same URL every time!
  backend:
    domain: my-api.ngrok-free.app
  agent:
    domain: my-agent.ngrok-free.app
```

Benefits:
- ✅ URLs don't change
- ✅ No need to update .env after restart
- ✅ Custom domains
- ✅ Remove ngrok branding

## 🔄 Restart Guide

### Restart Everything
1. Close all terminal windows
2. Run `start-ngrok.bat`
3. Run `node get-ngrok-urls.js`
4. Update `.env` files if URLs changed
5. Restart frontend and agent

### Restart Single Service

**Frontend Only:**
```bash
# In Frontend window
Ctrl+C
npm run dev
```

**Backend Only:**
```bash
# In Backend window
Ctrl+C
bun run dev
```

**Agent Only:**
```bash
# In Agent window
Ctrl+C
uv run main.py
```

## 📝 Daily Workflow

### Morning Setup (5 minutes)
```bash
# 1. Start all services
start-ngrok.bat

# 2. Get URLs
node get-ngrok-urls.js

# 3. Update .env files (if URLs changed)
# 4. Restart frontend and agent
# 5. Share frontend URL!
```

### End of Day
```bash
# Close all terminal windows
# Or press Ctrl+C in each window
```

## 🌐 Sharing Your App

Once deployed, share your frontend ngrok URL:

```
Hey! Check out my AI Research Assistant:
https://abc123.ngrok.io

Features:
- 🔍 Search ArXiv papers
- 📄 Generate research papers with AI
- 💾 PDF library management
- 🤖 Powered by Google Gemini
```

## 🆘 Support

**Ngrok Issues:**
- Dashboard: http://localhost:4040
- Docs: https://ngrok.com/docs

**Service Issues:**
- Check logs in terminal windows
- Verify ports are not in use
- Check environment variables

**App Issues:**
- Browser console for frontend errors
- Backend terminal for API errors
- Agent terminal for AI processing errors

---

**You're all set! 🎉**

Your complete AI Research Assistant stack is now publicly accessible via ngrok. Share the frontend URL to showcase your project to the world!
