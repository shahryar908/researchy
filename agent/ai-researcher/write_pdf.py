# Step1: Install tectonic & Import deps
from langchain_core.tools import tool
from datetime import datetime
from pathlib import Path
import subprocess
import shutil
import os
from typing import Optional

# Import Supabase storage helper
try:
    from supabase_storage import get_storage
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    get_storage = None

@tool
def render_latex_pdf(latex_content: str, topic: Optional[str] = None, user_id: Optional[str] = None, user_name: Optional[str] = None) -> str:
    """Render a LaTeX document to PDF and optionally upload to Supabase.

    Args:
        latex_content: The LaTeX document content as a string
        topic: The research topic/title for naming the PDF file
        user_id: Optional user ID for Supabase upload (from context)
        user_name: Optional user name to include as author in the PDF

    Returns:
        Path to the generated PDF document
    """
    print(f"DEBUG: render_latex_pdf called with topic: {topic}, user_id: {user_id}, user_name: {user_name}")

    # Get storage instance (lazy initialization)
    storage = None
    if SUPABASE_AVAILABLE and get_storage:
        print(f"DEBUG: Attempting to get storage instance...")
        storage = get_storage()
        if storage is None:
            print(f"DEBUG: get_storage() returned None - Supabase initialization failed")
        else:
            print(f"DEBUG: Storage instance obtained successfully")
    else:
        print(f"DEBUG: SUPABASE_AVAILABLE={SUPABASE_AVAILABLE}, get_storage={get_storage}")

    SUPABASE_ENABLED = storage is not None
    print(f"DEBUG: SUPABASE_ENABLED: {SUPABASE_ENABLED}")
    if shutil.which("tectonic") is None:
        raise RuntimeError(
            "tectonic is not installed. Install it first on your system."
        )

    try:
        # Step2: Create directory
        output_dir = Path("output").absolute()
        output_dir.mkdir(exist_ok=True)

        # Step3: Setup filenames with topic-based naming
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if topic:
            # Sanitize topic for filename (remove special chars, limit length)
            safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_'))
            safe_topic = safe_topic.replace(' ', '_').strip('_')[:50]  # Max 50 chars
            tex_filename = f"{safe_topic}_{timestamp}.tex"
            pdf_filename = f"{safe_topic}_{timestamp}.pdf"
        else:
            # Fallback to timestamp only
            tex_filename = f"paper_{timestamp}.tex"
            pdf_filename = f"paper_{timestamp}.pdf"
        # Step4: Export as tex & pdf
        tex_file = output_dir / tex_filename
        tex_file.write_text(latex_content)

        result = subprocess.run(
                    ["tectonic", tex_filename, "--outdir", str(output_dir)],
                    cwd=output_dir,
                    capture_output=True,
                    text=True,
                )

        final_pdf = output_dir / pdf_filename
        if not final_pdf.exists():
            raise FileNotFoundError("PDF file was not generated")

        print(f"Successfully generated PDF at {final_pdf}")

        # Step5: Upload to Supabase if enabled and user_id is provided
        supabase_path = None
        file_size = final_pdf.stat().st_size

        if SUPABASE_ENABLED and user_id:
            try:
                # Ensure bucket exists
                storage.ensure_bucket_exists()

                # Upload to Supabase
                success, error = storage.upload_pdf(
                    pdf_path=str(final_pdf),
                    user_id=user_id,
                    filename=pdf_filename
                )

                if success:
                    supabase_path = f"{user_id}/{pdf_filename}"
                    print(f"SUCCESS: PDF uploaded to Supabase: {pdf_filename}")
                else:
                    print(f"ERROR: Failed to upload to Supabase: {error}")

            except Exception as upload_error:
                print(f"WARNING: Supabase upload error (PDF still available locally): {upload_error}")

        elif user_id:
            print("INFO: Supabase not configured - PDF only available locally")

        # Step6: Notify backend to save paper metadata
        if user_id:
            try:
                import requests
                backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")

                # Send metadata to backend
                response = requests.post(
                    f"{backend_url}/api/research/papers/metadata",
                    json={
                        "user_id": user_id,
                        "filename": pdf_filename,
                        "title": topic or "Research Paper",
                        "supabase_path": supabase_path,
                        "file_size": file_size
                    },
                    headers={"x-internal-request": "true"},
                    timeout=5
                )

                if response.status_code == 200:
                    print(f"SUCCESS: Paper metadata saved to database")
                else:
                    print(f"WARNING: Failed to save paper metadata: {response.status_code}")

            except Exception as metadata_error:
                print(f"WARNING: Failed to save paper metadata (PDF still generated): {metadata_error}")

        return str(final_pdf)

    except Exception as e:
        print(f"Error rendering LaTeX: {str(e)}")
        raise