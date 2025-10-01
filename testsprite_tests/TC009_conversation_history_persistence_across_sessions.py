import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_conversation_history_persistence_across_sessions():
    # 1. Create a new conversation
    create_payload = {
        "title": "Test Conversation Persistence",
        "initial_message": "Hello, testing conversation persistence."
    }
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/conversations",
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Failed to create conversation: {create_resp.text}"
        conversation = create_resp.json()
        conversation_id = conversation.get("id")
        assert conversation_id, "Conversation ID missing in create response"

        # 2. Send a message in this conversation
        message_payload = {
            "message": "This is a follow-up message to check persistence."
        }
        send_msg_resp = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages",
            headers=HEADERS,
            json=message_payload,
            timeout=TIMEOUT
        )
        assert send_msg_resp.status_code == 200 or send_msg_resp.status_code == 201, f"Failed to send message: {send_msg_resp.text}"
        sent_message = send_msg_resp.json()
        assert "id" in sent_message, "Sent message ID missing"

        # 3. Fetch conversation history immediately and verify messages exist
        history_resp_1 = requests.get(
            f"{BASE_URL}/api/conversations/{conversation_id}/history",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert history_resp_1.status_code == 200, f"Failed to get conversation history: {history_resp_1.text}"
        history_1 = history_resp_1.json()
        messages_1 = history_1.get("messages", [])
        assert any(m.get("message") == create_payload["initial_message"] for m in messages_1), "Initial message missing in history"
        assert any(m.get("message") == message_payload["message"] for m in messages_1), "Follow-up message missing in history"

        # 4. Simulate user sign out by ending session or just start a new session (for this test, just simulate by new GET)
        # Assuming token remains same, simulate new session by re-fetching conversation history
        time.sleep(1)  # small wait to simulate time gap

        history_resp_2 = requests.get(
            f"{BASE_URL}/api/conversations/{conversation_id}/history",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert history_resp_2.status_code == 200, "Failed to get conversation history after session change"
        history_2 = history_resp_2.json()
        messages_2 = history_2.get("messages", [])
        assert messages_1 == messages_2, "Conversation history changed between sessions"

        # 5. Simulate server restart by waiting to ensure backend restart (No direct API for restart in this test)
        # Instead sleep to simulate some delay, then re-fetch
        # NOTE: Real restart cannot be done here; we test persistence across time gap
        time.sleep(2)  # simulate delay; ideally test environment restarts backend between these calls

        history_resp_3 = requests.get(
            f"{BASE_URL}/api/conversations/{conversation_id}/history",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert history_resp_3.status_code == 200, "Failed to get conversation history after server restart simulation"
        history_3 = history_resp_3.json()
        messages_3 = history_3.get("messages", [])
        assert messages_1 == messages_3, "Conversation history did not persist after simulated server restart"

    finally:
        # Cleanup: Delete the created conversation
        if 'conversation_id' in locals():
            delete_resp = requests.delete(
                f"{BASE_URL}/api/conversations/{conversation_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            # It is okay if deletion fails, just log or ignore. Not raising to avoid masking previous errors.


test_conversation_history_persistence_across_sessions()