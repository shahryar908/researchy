import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_performance_benchmarks_streaming_and_database():
    # Streaming latency measurement: simulate streaming chat endpoint
    streaming_url = f"{BASE_URL}/api/stream-chat"
    streaming_payload = {
        "query": "What are the latest advances in AI research?",
        "conversationId": None
    }
    try:
        start_stream = time.time()
        response_stream = requests.post(streaming_url, json=streaming_payload, headers=HEADERS, timeout=30)
        response_stream.raise_for_status()
        elapsed_stream = time.time() - start_stream

        assert response_stream.status_code == 200, "Streaming chat API did not return status 200"
        assert elapsed_stream < 5, f"Streaming latency too high: {elapsed_stream} seconds"

        # Database query time measurement via protected endpoint to list user's conversations
        conversations_url = f"{BASE_URL}/api/conversations"
        start_db = time.time()
        response_db = requests.get(conversations_url, headers=HEADERS, timeout=30)
        response_db.raise_for_status()
        elapsed_db = time.time() - start_db

        assert response_db.status_code == 200, "Conversations API did not return status 200"
        assert elapsed_db < 2, f"Database query time too high: {elapsed_db} seconds"

        # Caching efficiency: call the same conversations endpoint twice and measure second call speedup
        start_cache = time.time()
        response_cache = requests.get(conversations_url, headers=HEADERS, timeout=30)
        response_cache.raise_for_status()
        elapsed_cache = time.time() - start_cache

        assert response_cache.status_code == 200, "Cached conversations API call did not return status 200"
        # Expect caching to reduce time at least 30% compared to first call, but allow some tolerance
        assert elapsed_cache <= elapsed_db, f"Caching did not improve performance: first call {elapsed_db}s, second call {elapsed_cache}s"

    except requests.exceptions.RequestException as e:
        assert False, f"RequestException during performance test: {e}"

test_performance_benchmarks_streaming_and_database()