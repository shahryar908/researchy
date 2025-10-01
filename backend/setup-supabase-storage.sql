-- Supabase Storage Setup for Research Papers
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket (if not already created via dashboard)
-- Note: You may need to create this via the Supabase dashboard instead
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('researchy', 'researchy', false, 52428800, '{"application/pdf"}');

-- 2. Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy to allow authenticated users to upload PDFs to their own folder
CREATE POLICY "Allow authenticated users to upload PDFs to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'researchy' 
    AND storage.extension(name) = 'pdf'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create RLS policy to allow users to view/download their own PDFs
CREATE POLICY "Allow users to download own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'researchy'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND storage.extension(name) = 'pdf'
);

-- 5. Create RLS policy to allow users to update their own PDFs
CREATE POLICY "Allow users to update own PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'researchy'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND storage.extension(name) = 'pdf'
)
WITH CHECK (
    bucket_id = 'researchy'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND storage.extension(name) = 'pdf'
);

-- 6. Create RLS policy to allow users to delete their own PDFs
CREATE POLICY "Allow users to delete own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'researchy'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND storage.extension(name) = 'pdf'
);

-- 7. Grant necessary permissions to authenticated users
-- These should already be granted, but included for completeness
-- GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
-- GRANT SELECT ON storage.buckets TO authenticated;

-- Optional: Create a function to clean up old PDFs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_pdfs()
RETURNS void
LANGUAGE sql
SECURITY definer
AS $$
  DELETE FROM storage.objects 
  WHERE bucket_id = 'research-papers' 
  AND created_at < NOW() - INTERVAL '30 days';
$$;

-- Optional: Create an index for better performance on folder queries
CREATE INDEX IF NOT EXISTS idx_storage_objects_folder 
ON storage.objects USING gin((storage.foldername(name)));

-- Display success message
SELECT 'Supabase Storage setup completed successfully!' as status;