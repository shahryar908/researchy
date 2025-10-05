# FastAPI Server Deployment Guide (Render)

This guide will help you deploy the FastAPI research agent server to Render.

---

## **Prerequisites**

1. Render account: [render.com](https://render.com)
2. Google Gemini API key for LangChain
3. Supabase credentials (optional, for PDF storage)

---

## **Deployment Steps**

### **1. Create New Web Service on Render**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `shahryar908/researchy`
4. Click **"Connect"**

### **2. Configure Service Settings**

| Setting | Value |
|---------|-------|
| **Name** | `researchy-fastapi` (or your preferred name) |
| **Region** | Oregon (US West) or closest to your users |
| **Branch** | `main` |
| **Root Directory** | **Leave empty** (important!) |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `fastapi-dockerfile` |

**💡 Monorepo Note:**
- Root Directory must be **empty** so Render can access the entire repository
- The Dockerfile (`fastapi-dockerfile`) copies files from `agent/ai-researcher/` subdirectory
- This setup allows Docker to build the FastAPI app from the monorepo structure

### **3. Environment Variables**

Click **"Environment"** and add these variables:

#### **Required:**
```bash
GOOGLE_API_KEY=your_google_gemini_api_key_here
PORT=8000
```

#### **Optional (for Supabase PDF storage):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

**To get Google Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it as `GOOGLE_API_KEY`

### **4. Deploy**

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for deployment to complete (2-5 minutes)
4. Note your FastAPI URL: `https://researchy-fastapi.onrender.com`

---

## **Update Backend to Use FastAPI**

After deployment, update your backend environment variable:

### **In Render (Backend Service)**

1. Go to your backend service: `researchy-1`
2. **Settings** → **Environment Variables**
3. Update `FASTAPI_URL`:
   ```
   FASTAPI_URL=https://researchy-fastapi.onrender.com
   ```
4. **Save Changes**
5. Render will auto-redeploy the backend

---

## **Verify Deployment**

### **Test FastAPI Health:**

Visit: `https://researchy-fastapi.onrender.com/docs`

You should see the FastAPI Swagger documentation.

### **Test Endpoints:**

1. **GET** `/` - Health check
2. **POST** `/api/chat` - Chat with AI researcher
3. **POST** `/api/chat/stream` - Streaming chat
4. **GET** `/api/papers/list` - List generated papers
5. **GET** `/api/papers/download/{filename}` - Download paper

---

## **Architecture**

```
Frontend (Vercel)
    ↓
Backend (Render - Node.js/Bun)
    ↓
FastAPI (Render - Python)
    ↓
Google Gemini API + ArXiv API
```

---

## **Important Notes**

### **Free Tier Limitations:**
- Render free instances spin down after 15 minutes of inactivity
- First request after spin-down may take 50+ seconds
- Upgrade to paid plan for always-on service

### **PDF Storage:**
- Without Supabase: PDFs stored locally (lost on restart)
- With Supabase: PDFs stored permanently in cloud storage

---

## **Troubleshooting**

### **Build Fails**
- Check that `agent/ai-researcher/requirements.txt` exists
- Verify Python dependencies are correct
- Check build logs for specific errors

### **Runtime Errors**
- Verify `GOOGLE_API_KEY` is set correctly
- Check FastAPI logs in Render dashboard
- Ensure all required dependencies are installed

### **CORS Errors**
- FastAPI CORS is already configured for your backend
- If needed, update `allow_origins` in `agent/ai-researcher/main.py`

---

## **Cost Estimates**

### **Free Tier (Getting Started)**
- **Render FastAPI**: Free (with spin-down)
- **Google Gemini API**: Free tier (60 requests/minute)

### **Production (Recommended)**
- **Render FastAPI**: $7/month (always-on)
- **Google Gemini API**: Pay-as-you-go

---

## **Next Steps After Deployment**

1. ✅ Test the `/docs` endpoint
2. ✅ Update backend `FASTAPI_URL` environment variable
3. ✅ Test full flow: Frontend → Backend → FastAPI
4. ✅ Monitor logs for any errors
5. 🎉 Your full-stack AI research app is live!
