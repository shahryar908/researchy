# Deployment Guide

This guide will help you deploy the backend to Render and the frontend to Vercel.

---

## Backend Deployment (Render)

### Prerequisites
1. Create a [Render](https://render.com) account
2. Have your environment variables ready (Clerk, Supabase, etc.)

### Steps

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Prepare backend for Render deployment"
   git push
   ```

2. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as the root directory

3. **Configure the service**
   - **Name**: `research-project-backend` (or your preferred name)
   - **Region**: Oregon (US West) or your preferred region
   - **Branch**: `main` or your default branch
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**:
     ```
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**:
     ```
     node dist/index.js
     ```

4. **Add Environment Variables** (in Render Dashboard)
   Click "Environment" tab and add:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=file:./prisma/dev.db
   CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
   CLERK_SECRET_KEY=sk_live_your_secret_here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   FASTAPI_URL=https://your-fastapi-url.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend
   - Note your backend URL: `https://research-project-backend.onrender.com`

### Database Setup
For production, consider upgrading from SQLite to PostgreSQL:
1. Create a PostgreSQL database on Render
2. Update `DATABASE_URL` environment variable
3. Update `prisma/schema.prisma` datasource to use PostgreSQL

---

## Frontend Deployment (Vercel)

### Prerequisites
1. Create a [Vercel](https://vercel.com) account
2. Install Vercel CLI (optional): `npm i -g vercel`

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Prepare frontend for Vercel deployment"
   git push
   ```

2. **Import Project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `frontend` directory

3. **Configure the project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key_here
   CLERK_SECRET_KEY=sk_live_your_secret_here
   NEXT_PUBLIC_API_URL=https://research-project-backend.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Your app will be live at: `https://your-app.vercel.app`

### Option 2: Deploy via CLI

```bash
cd frontend
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? research-project-frontend
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_API_URL

# Deploy to production
vercel --prod
```

---

## Post-Deployment Configuration

### 1. Update CORS Settings (Backend)
Update the CORS origin in `backend/index.ts`:
```typescript
app.use(cors({
    origin: 'https://your-app.vercel.app', // Update with your Vercel URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Redeploy backend after this change.

### 2. Update Clerk Settings
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Update allowed origins to include:
   - `https://your-app.vercel.app`
   - `https://research-project-backend.onrender.com`

### 3. Test the Deployment
- Visit your Vercel frontend URL
- Test authentication flow
- Test API communication between frontend and backend

---

## Continuous Deployment

### Automatic Deployments
Both Render and Vercel support automatic deployments:
- **Render**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

### Preview Deployments (Vercel)
Vercel automatically creates preview deployments for pull requests.

---

## Troubleshooting

### Backend Issues
- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set correctly
- Ensure database migrations ran successfully

### Frontend Issues
- Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
- Verify `NEXT_PUBLIC_API_URL` points to your Render backend
- Check browser console for CORS errors

### Database Migration
If you need to run migrations manually on Render:
```bash
# In Render Shell (Dashboard → Shell)
npx prisma migrate deploy
```

---

## Production Recommendations

1. **Database**: Migrate from SQLite to PostgreSQL for production
2. **Environment**: Use production Clerk keys
3. **Monitoring**: Set up error tracking (e.g., Sentry)
4. **Backups**: Configure database backups on Render
5. **SSL**: Both Render and Vercel provide free SSL certificates
6. **Scaling**: Consider upgrading Render plan for better performance

---

## Cost Estimates

### Free Tier (Getting Started)
- **Render**: Free tier (spins down after 15 min of inactivity)
- **Vercel**: Generous free tier for hobby projects

### Production (Recommended)
- **Render**: Starting at $7/month for persistent service
- **Vercel**: Pro plan $20/month (if needed)

---

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Clerk Docs: https://clerk.com/docs
