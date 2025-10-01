import requests
import io

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_file_upload_and_download_with_permissions():
    upload_url = f"{BASE_URL}/files/upload"
    download_url_template = f"{BASE_URL}/files/download/{{file_id}}"
    delete_url_template = f"{BASE_URL}/files/{{file_id}}"

    sample_filename = "test_upload.txt"
    sample_content = b"Test file content for upload and download with permissions."

    file_id = None
    try:
        # Step 1: Upload file using in-memory BytesIO
        file_obj = io.BytesIO(sample_content)
        files = {"file": (sample_filename, file_obj)}
        response = requests.post(upload_url, headers=HEADERS, files=files, timeout=TIMEOUT)

        assert response.status_code == 201, f"File upload failed with status code {response.status_code}"
        json_resp = response.json()
        assert "file_id" in json_resp or "id" in json_resp, "Response missing file id"
        file_id = json_resp.get("file_id") or json_resp.get("id")
        assert isinstance(file_id, (str, int)), "file_id is not a string or int"

        # Step 2: Download file and validate content and permissions
        download_url = download_url_template.format(file_id=file_id)
        download_response = requests.get(download_url, headers=HEADERS, timeout=TIMEOUT)
        assert download_response.status_code == 200, f"File download failed with status code {download_response.status_code}"
        # Validate content matches
        assert download_response.content == sample_content, "Downloaded file content does not match uploaded content"

        # Step 3: Test permission fallback: try download without auth, expect 401 or 403
        no_auth_response = requests.get(download_url, timeout=TIMEOUT)
        assert no_auth_response.status_code in (401, 403), f"Unauthorized access did not return 401 or 403, got {no_auth_response.status_code}"

    finally:
        # Cleanup: delete the uploaded file if created
        if file_id:
            try:
                delete_url = delete_url_template.format(file_id=file_id)
                del_response = requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)
                # Accept 200 or 204 as successful delete
                assert del_response.status_code in (200, 204), f"File deletion failed with status {del_response.status_code}"
            except Exception:
                pass

test_file_upload_and_download_with_permissions()
