# Supabase Storage Setup Guide for Research PDFs

## Prerequisites
You've already configured your Supabase project. Now we need to set up storage and get the correct service key.

## Step 1: Get the Service Role Key

⚠️ **Important**: Your current `SUPABASE_SERVICE_KEY` appears to be the same as your anon key. You need the actual service role key.

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `fvkzgbohywtsxdjwhnzs`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (not the anon key)
5. Update your `.env` files with the correct service key

## Step 2: Create Storage Bucket

1. In your Supabase Dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Set these values:
   - **Name**: `research-papers`
   - **Public**: ❌ (Keep it private)
   - **File size limit**: `50MB` (or adjust as needed)
   - **Allowed MIME types**: `application/pdf`

## Step 3: Set Up RLS Policies

1. Go to **SQL Editor** in your Supabase Dashboard
2. Run the SQL script from `setup-supabase-storage.sql`
3. This will create secure policies so users can only access their own PDFs

## Step 4: Test the Setup

Once configured, your application will:
1. ✅ Generate PDFs locally (as backup)
2. ✅ Upload PDFs to Supabase automatically  
3. ✅ Serve PDFs from Supabase (with local fallback)
4. ✅ Work seamlessly after deployment

## File Organization in Supabase

PDFs will be stored in user-specific folders:
```
research-papers/
├── user_abc123/
│   ├── paper_20250930_120000.pdf
│   └── paper_20250930_130000.pdf
└── user_def456/
    ├── paper_20250930_140000.pdf
    └── paper_20250930_150000.pdf
```

## Environment Variables Needed

Make sure both `.env` files have:
```env
SUPABASE_URL=https://fvkzgbohywtsxdjwhnzs.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_actual_service_role_key_here
```

## Security Features

✅ **User Isolation**: Each user can only access their own PDFs
✅ **File Type Restriction**: Only PDF files are allowed
✅ **Size Limits**: 50MB maximum per file
✅ **Authentication Required**: Must be logged in to upload/download
✅ **Automatic Cleanup**: Optional cleanup of old files

## Benefits After Setup

🚀 **Production Ready**: PDFs survive deployments and restarts
🌍 **Global CDN**: Fast downloads from 285+ cities worldwide  
🔒 **Secure**: User-specific access with RLS policies
📈 **Scalable**: Handles growth automatically
💰 **Cost Effective**: Pay-as-you-go pricing
🔄 **Fallback**: Local storage still works as backup

Your research application will now have enterprise-grade PDF storage! 🎉