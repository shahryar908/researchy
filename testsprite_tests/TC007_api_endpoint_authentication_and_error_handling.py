import requests
from requests.exceptions import RequestException, Timeout

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"
HEADERS_AUTH = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}
HEADERS_NO_AUTH = {"Accept": "application/json"}
TIMEOUT = 30

def test_api_endpoint_authentication_and_error_handling():
    endpoints_to_test = [
        {"url": f"{BASE_URL}/api/user/session", "method": "GET"},
        {"url": f"{BASE_URL}/api/research/conversations", "method": "GET"},
        {"url": f"{BASE_URL}/api/research/conversations", "method": "POST", "payload": {"title": "Test Conversation"}},
        {"url": f"{BASE_URL}/api/research/papers/search?query=machine+learning", "method": "GET"},
        {"url": f"{BASE_URL}/api/pdf/extract", "method": "POST", "payload": {"pdf_url": "https://arxiv.org/pdf/2106.01342.pdf"}},
        {"url": f"{BASE_URL}/api/latex/generate", "method": "POST", "payload": {"content": "E=mc^2"}},
        # Add more endpoints from backend API that require authentication and return data
    ]

    for ep in endpoints_to_test:
        url = ep["url"]
        method = ep["method"]
        payload = ep.get("payload")

        # 1. Request without auth - expect 401 or 403 or 404
        try:
            if method == "GET":
                resp = requests.get(url, headers=HEADERS_NO_AUTH, timeout=TIMEOUT)
            elif method == "POST":
                resp = requests.post(url, json=payload, headers=HEADERS_NO_AUTH, timeout=TIMEOUT)
            else:
                continue  # unsupported method for this test

            assert resp.status_code in {401, 403, 404}, \
                f"Endpoint {url} without auth should return 401 or 403 or 404 but returned {resp.status_code}"
        except (RequestException, Timeout) as e:
            assert False, f"Request to {url} without auth failed: {e}"

        # 2. Request with auth - expect 200 with valid data or other success code (201, etc)
        try:
            if method == "GET":
                resp = requests.get(url, headers=HEADERS_AUTH, timeout=TIMEOUT)
            elif method == "POST":
                resp = requests.post(url, json=payload, headers=HEADERS_AUTH, timeout=TIMEOUT)
            else:
                continue

            assert resp.status_code in {200, 201}, f"Endpoint {url} with auth returned unexpected status {resp.status_code}"
            # Basic check that response is JSON
            try:
                data = resp.json()
                # Check data is dictionary or list as typical API response
                assert isinstance(data, (dict, list)), f"Endpoint {url} returned JSON but not dict/list"
            except ValueError:
                assert False, f"Endpoint {url} response is not JSON"

        except (RequestException, Timeout) as e:
            assert False, f"Request to {url} with auth failed: {e}"

        # 3. Request with invalid auth token - expect 401 or 403
        try:
            headers_invalid = {"Authorization": "Bearer invalidtoken123", "Accept": "application/json"}
            if method == "GET":
                resp = requests.get(url, headers=headers_invalid, timeout=TIMEOUT)
            elif method == "POST":
                resp = requests.post(url, json=payload, headers=headers_invalid, timeout=TIMEOUT)
            else:
                continue

            assert resp.status_code in {401, 403}, \
                f"Endpoint {url} with invalid auth should return 401 or 403 but returned {resp.status_code}"
        except (RequestException, Timeout) as e:
            assert False, f"Request to {url} with invalid auth failed: {e}"

test_api_endpoint_authentication_and_error_handling()