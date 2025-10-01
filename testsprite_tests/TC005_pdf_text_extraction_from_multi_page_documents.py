import requests

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}

def test_pdf_text_extraction_from_multi_page_documents():
    """
    Test case TC005:
    Validate that PDF text extraction correctly handles multi-page documents and can read PDFs from web URLs.
    """
    # Example multi-page PDF publicly available URL (must be reachable)
    pdf_url = "https://arxiv.org/pdf/1706.03762.pdf"  # Known multi-page academic paper PDF
    
    # Endpoint for PDF text extraction
    endpoint = f"{BASE_URL}/api/pdf/extract-text"
    
    # Payload according to typical PDF processing API schema
    payload = {
        "source": {
            "type": "url",
            "url": pdf_url
        }
    }
    
    timeout = 30
    
    try:
        response = requests.post(endpoint, json=payload, headers=HEADERS, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as e:
        raise AssertionError(f"API request failed: {e}")
    
    data = response.json()
    
    # Validate general structure and content
    
    # Expecting a JSON response with keys 'text' and possibly 'pages' for multi-page content
    assert isinstance(data, dict), "Response JSON should be a dictionary"
    assert "text" in data or "pages" in data, "Response should contain 'text' or 'pages' key"
    
    extracted_text = data.get("text", None)
    extracted_pages = data.get("pages", None)
    
    # We expect either a full text string or a list of page texts
    if extracted_text:
        assert isinstance(extracted_text, str), "'text' should be a string"
        assert len(extracted_text.strip()) > 0, "Extracted text should not be empty"
    elif extracted_pages:
        assert isinstance(extracted_pages, list), "'pages' should be a list"
        assert len(extracted_pages) > 1, "There should be multiple pages extracted"
        for page_text in extracted_pages:
            assert isinstance(page_text, str), "Each page text should be a string"
            assert len(page_text.strip()) > 0, "Page text should not be empty"
    else:
        raise AssertionError("Response does not contain valid text extraction data")
    
    # Additional sanity check: Verify that the extracted content contains some known keywords from the PDF
    sample_keywords = ["Transformer", "Attention", "Neural", "Network", "Sequence", "Model"]
    content_to_check = extracted_text if extracted_text else " ".join(extracted_pages)
    matches = [kw for kw in sample_keywords if kw in content_to_check]
    assert len(matches) >= 2, "Extracted text should contain expected content keywords for multi-page PDF"

test_pdf_text_extraction_from_multi_page_documents()