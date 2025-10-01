import requests
import time
import re

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}


def test_latex_pdf_generation_with_math_and_bibliography():
    # Sample LaTeX content with math notation and bibliography references
    # This example includes math environments and citation keys.
    latex_content = r"""
    \documentclass{article}
    \usepackage{amsmath}
    \usepackage{biblatex}
    \addbibresource{references.bib}

    \begin{document}

    \title{Sample LaTeX Document with Math and Bibliography}
    \author{Test User}
    \date{\today}
    \maketitle

    Here is a famous equation:
    \begin{equation}
      E = mc^2
    \end{equation}

    Another important formula:
    \[
      \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
    \]

    A citation example \cite{einstein1905}.

    \printbibliography
    \end{document}
    """

    # Sample bibliography content (must be sent or included as file; assuming API handles names)
    bibliography_content = r"""
    @article{einstein1905,
      author = {Albert Einstein},
      title = {Zur Elektrodynamik bewegter Körper},
      journal = {Annalen der Physik},
      volume = {322},
      number = {10},
      pages = {891--921},
      year = {1905},
      publisher = {Wiley Online Library}
    }
    """

    # Construct the payload as per API requirements for LaTeX PDF generation including math, bibliography and timestamp option.
    payload = {
        "latex_source": latex_content,
        "bibliography_source": bibliography_content,
        "options": {
            "include_math": True,
            "include_bibliography": True,
            "timestamp_file": True
        }
    }

    pdf_resource_id = None
    try:
        # POST to /latex/generate to create PDF from LaTeX source
        resp = requests.post(
            f"{BASE_URL}/latex/generate",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        assert resp.status_code == 201 or resp.status_code == 200, f"Unexpected status code: {resp.status_code}"
        resp_data = resp.json()
        assert "pdf_id" in resp_data, "Response missing 'pdf_id'"
        pdf_resource_id = resp_data["pdf_id"]

        # GET the generated PDF metadata to verify
        meta_resp = requests.get(
            f"{BASE_URL}/latex/pdf/{pdf_resource_id}/metadata",
            headers=HEADERS,
            timeout=30
        )
        assert meta_resp.status_code == 200, f"Metadata fetch failed: {meta_resp.status_code}"
        metadata = meta_resp.json()

        # Validate metadata has keys indicating math and bibliography presence and timestamped file name
        assert "contains_math" in metadata and metadata["contains_math"] is True, "Math notation not marked in metadata"
        assert "contains_bibliography" in metadata and metadata["contains_bibliography"] is True, "Bibliography not marked in metadata"
        assert "filename" in metadata and metadata["filename"].endswith(".pdf"), "Filename missing or invalid"

        # Check filename contains a timestamp pattern e.g. YYYYMMDD or similar
        timestamp_match = re.search(r"\d{8,}", metadata["filename"])
        assert timestamp_match is not None, "Timestamp missing in filename"

        # Download the generated PDF binary to verify accessibility
        pdf_resp = requests.get(
            f"{BASE_URL}/latex/pdf/{pdf_resource_id}/download",
            headers=HEADERS,
            timeout=30
        )
        assert pdf_resp.status_code == 200, f"PDF download failed: {pdf_resp.status_code}"
        content_type = pdf_resp.headers.get("Content-Type", "")
        assert content_type == "application/pdf", f"Invalid content type: {content_type}"

        # Check that the PDF content is non-empty and roughly large enough for math and bibliography
        assert len(pdf_resp.content) > 1000, "PDF content too small - likely invalid"

    finally:
        # Clean up: delete the generated PDF resource to avoid residue
        if pdf_resource_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/latex/pdf/{pdf_resource_id}",
                    headers=HEADERS,
                    timeout=30
                )
                assert del_resp.status_code == 204 or del_resp.status_code == 200, f"Failed to delete PDF resource: {del_resp.status_code}"
            except Exception as e:
                pass


test_latex_pdf_generation_with_math_and_bibliography()