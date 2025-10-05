# 🚀 Ngrok Deployment Checklist

Use this checklist to ensure successful deployment of your AI Research Assistant.

## 📋 Pre-Deployment Setup

### ✅ Prerequisites
- [ ] ngrok v3.25.1+ installed
- [ ] ngrok account created at https://dashboard.ngrok.com
- [ ] Bun runtime installed
- [ ] Python with uv package manager
- [ ] Frontend deployed on Vercel
- [ ] All environment variables configured

### ✅ Configuration Files
- [x] `ngrok.yml` - Tunnel configuration created
- [x] `start-ngrok.bat` - Deployment script created
- [x] `get-ngrok-urls.js` - URL helper created
- [x] `package.json` - NPM scripts configured
- [ ] `ngrok.yml` - Auth token updated with YOUR token
- [ ] Backend CORS updated for ngrok
- [ ] Agent CORS updated for ngrok

## 🔧 First-Time Setup

### Step 1: Ngrok Authentication
```bash
# Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok.cmd authtoken YOUR_NGROK_AUTH_TOKEN
```
- [ ] Auth token copied from dashboard
- [ ] Auth token configured with ngrok
- [ ] Configuration verified: `ngrok.cmd config check`

### Step 2: Update ngrok.yml
```yaml
authtoken: YOUR_ACTUAL_TOKEN  # Replace this!
```
- [ ] Opened ngrok.yml file
- [ ] Replaced YOUR_NGROK_AUTH_TOKEN with actual token
- [ ] Saved file

### Step 3: Install Dependencies
```bash
npm install
```
- [ ] axios installed (for get-ngrok-urls.js)
- [ ] No installation errors

## 🚀 Deployment Process

### Step 1: Start Services
```bash
start-ngrok.bat
```
Wait 10-15 seconds for services to initialize.

- [ ] Ngrok tunnels window opened
- [ ] Backend (Bun) window opened
- [ ] Agent (uv Python) window opened
- [ ] No error messages in any window

### Step 2: Verify Local Services
```bash
# Backend health check
curl http://localhost:3001

# Agent health check
curl http://localhost:8000/health
```
- [ ] Backend responds on port 3001
- [ ] Agent responds on port 8000
- [ ] Both return valid JSON

### Step 3: Get Public URLs
```bash
node get-ngrok-urls.js
```
- [ ] Script ran successfully
- [ ] Backend ngrok URL displayed
- [ ] Agent ngrok URL displayed
- [ ] Environment variables shown

### Step 4: Verify Ngrok Dashboard
Open: http://localhost:4040

- [ ] Dashboard loads
- [ ] Shows 2 active tunnels (backend, agent)
- [ ] Both tunnels show "online" status

## 🌐 Environment Configuration

### Vercel Frontend
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables

- [ ] Opened Vercel dashboard
- [ ] Located project settings
- [ ] Found environment variables section
- [ ] Added/Updated `NEXT_PUBLIC_API_URL`
- [ ] Value: Backend ngrok URL (https://xxxx.ngrok.io)
- [ ] Saved changes
- [ ] Triggered redeploy (or auto-deployed via git)

### Agent Environment
Edit: `agent/ai-researcher/.env`
```env
BACKEND_URL=https://yyyy.ngrok.io
```
- [ ] Opened agent/.env file
- [ ] Added/Updated BACKEND_URL
- [ ] Value: Backend ngrok URL
- [ ] Saved file
- [ ] Restarted agent (Ctrl+C, then `uv run main.py`)

## 🧪 Testing

### Frontend Tests
Visit your Vercel URL: https://your-app.vercel.app

- [ ] Frontend loads without errors
- [ ] Can access sign-in page
- [ ] Clerk authentication works
- [ ] Chat interface loads

### Backend Connectivity
- [ ] Send a test message in chat
- [ ] Message appears in Ngrok dashboard (request to backend)
- [ ] Agent processes request (visible in Agent terminal)
- [ ] Response appears in chat

### Full Feature Test
- [ ] Search for papers (ArXiv tool)
- [ ] Generate a research paper (PDF generation)
- [ ] Download PDF from library
- [ ] View paper metadata in dashboard

### Monitoring
- [ ] Ngrok dashboard shows incoming requests
- [ ] Backend terminal shows logs
- [ ] Agent terminal shows processing
- [ ] No CORS errors in browser console

## 📊 Verification Commands

```bash
# Check ngrok config
ngrok.cmd config check

# Get current URLs
npm run urls

# Test backend locally
curl http://localhost:3001

# Test agent locally
curl http://localhost:8000/health

# View ngrok status
# Open: http://localhost:4040
```

## 🐛 Troubleshooting Checklist

### If ngrok won't start:
- [ ] Check auth token is correct
- [ ] Verify ngrok.yml syntax
- [ ] Close existing ngrok processes
- [ ] Check firewall settings

### If services won't connect:
- [ ] Verify CORS includes ngrok patterns
- [ ] Check environment variables are correct
- [ ] Ensure backend URL in agent .env is ngrok URL (not localhost)
- [ ] Restart agent after updating .env

### If frontend can't connect:
- [ ] Verify Vercel env var is updated
- [ ] Confirm frontend is redeployed
- [ ] Check browser console for errors
- [ ] Verify ngrok tunnels are active

### If URLs keep changing:
- [ ] This is expected on free tier
- [ ] Update env vars after each restart
- [ ] Consider upgrading to paid plan for static domains

## 📝 Session Checklist (Every Time)

Use this for each deployment session:

1. **Start Services**
   - [ ] Run `start-ngrok.bat`
   - [ ] Wait 10-15 seconds

2. **Get URLs**
   - [ ] Run `node get-ngrok-urls.js`
   - [ ] Copy backend URL

3. **Update Vercel** (if URLs changed)
   - [ ] Update `NEXT_PUBLIC_API_URL`
   - [ ] Redeploy

4. **Update Agent** (if backend URL changed)
   - [ ] Update `BACKEND_URL` in .env
   - [ ] Restart agent

5. **Test**
   - [ ] Visit Vercel URL
   - [ ] Send test message
   - [ ] Verify in ngrok dashboard

## ✅ Success Criteria

Your deployment is successful when:

✅ All services running (ngrok, backend, agent)
✅ 2 active tunnels in ngrok dashboard
✅ Vercel frontend loads and connects
✅ Can authenticate with Clerk
✅ Can send messages and get responses
✅ Can generate and download PDFs
✅ All requests visible in ngrok dashboard
✅ No CORS or connection errors

## 🎉 Post-Deployment

Once everything works:
- [ ] Save your current ngrok URLs for reference
- [ ] Test all major features
- [ ] Share Vercel URL for demos
- [ ] Monitor ngrok dashboard for issues
- [ ] Document any custom configurations

## 📞 Support Resources

- **Ngrok Dashboard:** https://dashboard.ngrok.com
- **Ngrok Docs:** https://ngrok.com/docs
- **Project Docs:**
  - [QUICK_START.md](QUICK_START.md)
  - [NGROK_DEPLOYMENT.md](NGROK_DEPLOYMENT.md)
  - [NGROK_SETUP_SUMMARY.md](NGROK_SETUP_SUMMARY.md)

---

**Deployment Status:**
- [ ] ⏳ Not Started
- [ ] 🔄 In Progress
- [ ] ✅ Complete & Tested

**Last Deployment:** _________________

**Current URLs:**
- Frontend: _________________
- Backend: _________________
- Agent: _________________
