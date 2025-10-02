# supabase_storage.py - Supabase Storage operations for PDF files
import os
from pathlib import Path
from typing import Optional, Tuple
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseStorage:
    def __init__(self):
        """Initialize Supabase client"""
        # Force reload of environment variables
        load_dotenv()
        
        url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        print(f"DEBUG SupabaseStorage init: URL={url is not None}, SERVICE_KEY={service_key is not None}")
        
        if not url or not service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")
        
        # Use service key for server-side operations (bypasses RLS)
        self.supabase: Client = create_client(url, service_key)
        self.bucket_name = "researchy"
    
    def ensure_bucket_exists(self) -> bool:
        """Create bucket if it doesn't exist"""
        try:
            # Check if bucket exists
            buckets = self.supabase.storage.list_buckets()
            
            bucket_exists = any(bucket.name == self.bucket_name for bucket in buckets)
            
            if not bucket_exists:
                # Create bucket
                result = self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={
                        "public": False,  # Private bucket for security
                        "allowedMimeTypes": ["application/pdf"],
                        "fileSizeLimit": 52428800  # 50MB limit
                    }
                )
                print(f"Created bucket '{self.bucket_name}': {result}")
            
            return True
            
        except Exception as e:
            print(f"Error ensuring bucket exists: {e}")
            return False
    
    def upload_pdf(self, pdf_path: str, user_id: str, filename: str) -> Tuple[bool, Optional[str]]:
        """
        Upload PDF to Supabase Storage
        
        Args:
            pdf_path: Local path to PDF file
            user_id: User ID for folder organization
            filename: Name of the file
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            if not Path(pdf_path).exists():
                return False, f"PDF file not found: {pdf_path}"
            
            # Create user-specific file path
            file_path = f"{user_id}/{filename}"
            
            # Read file content
            with open(pdf_path, 'rb') as file:
                file_content = file.read()
            
            # Upload to Supabase
            result = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": "application/pdf",
                    "cache-control": "3600",
                    "upsert": "true"  # Allow overwriting
                }
            )
            
            if result.path:
                print(f"Successfully uploaded PDF: {result.path}")
                return True, None
            else:
                return False, "Upload failed - no path returned"
                
        except Exception as e:
            error_msg = f"Error uploading PDF: {str(e)}"
            print(error_msg)
            return False, error_msg
    
    def download_pdf(self, user_id: str, filename: str) -> Tuple[bool, Optional[bytes], Optional[str]]:
        """
        Download PDF from Supabase Storage
        
        Args:
            user_id: User ID for folder organization
            filename: Name of the file
            
        Returns:
            Tuple of (success, file_content, error_message)
        """
        try:
            # Create user-specific file path
            file_path = f"{user_id}/{filename}"
            
            # Download from Supabase
            result = self.supabase.storage.from_(self.bucket_name).download(file_path)
            
            if result:
                print(f"Successfully downloaded PDF: {file_path}")
                return True, result, None
            else:
                return False, None, "Download failed - no content returned"
                
        except Exception as e:
            error_msg = f"Error downloading PDF: {str(e)}"
            print(error_msg)
            return False, None, error_msg
    
    def list_user_pdfs(self, user_id: str) -> list:
        """List all PDFs for a specific user"""
        try:
            # List files in user's folder
            result = self.supabase.storage.from_(self.bucket_name).list(f"{user_id}/")
            
            # Filter for PDF files
            pdf_files = [
                file for file in result 
                if file.get('name', '').lower().endswith('.pdf')
            ]
            
            return pdf_files
            
        except Exception as e:
            print(f"Error listing user PDFs: {e}")
            return []
    
    def delete_pdf(self, user_id: str, filename: str) -> Tuple[bool, Optional[str]]:
        """Delete PDF from Supabase Storage"""
        try:
            file_path = f"{user_id}/{filename}"
            
            result = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            
            if result:
                print(f"Successfully deleted PDF: {file_path}")
                return True, None
            else:
                return False, "Delete failed"
                
        except Exception as e:
            error_msg = f"Error deleting PDF: {str(e)}"
            print(error_msg)
            return False, error_msg

# Global instance - lazy initialization
storage = None

def get_storage():
    """Get or create the global storage instance"""
    global storage
    if storage is None:
        try:
            print(f"DEBUG get_storage: Attempting to create SupabaseStorage instance...")
            storage = SupabaseStorage()
            print(f"DEBUG get_storage: SupabaseStorage instance created successfully")
        except ValueError as e:
            print(f"ERROR get_storage: Supabase storage not available: {e}")
            return None
        except Exception as e:
            print(f"ERROR get_storage: Unexpected error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None
    return storage