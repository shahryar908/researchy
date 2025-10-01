import requests
import time

BASE_URL = "http://localhost:8000"
TOKEN = "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_ai_generated_conversation_titles():
    conversation_id = None
    created_conversation = None
    try:
        # Step 1: Create a new conversation with initial messages
        create_payload = {
            "title": None,  # Let AI generate the title
            "messages": [
                {"role": "user", "content": "Discuss the implications of quantum computing on cryptography."},
                {"role": "assistant", "content": "Quantum computing could break many classical cryptographic systems, so developing quantum-resistant algorithms is crucial."}
            ]
        }
        # Assuming POST /conversations creates a conversation and triggers AI title generation
        resp_create = requests.post(f"{BASE_URL}/conversations", json=create_payload, headers=HEADERS, timeout=30)
        assert resp_create.status_code == 201, f"Failed to create conversation: {resp_create.text}"
        created_conversation = resp_create.json()
        conversation_id = created_conversation.get("id")
        assert conversation_id is not None, "Created conversation ID is missing"
        
        # Step 2: Retrieve the conversation to verify AI-generated title
        # Possibly AI title generation is async; retry for a short while if title not set immediately
        title = created_conversation.get("title")
        if not title or title.strip() == "":
            for _ in range(5):
                time.sleep(2)
                resp_get = requests.get(f"{BASE_URL}/conversations/{conversation_id}", headers=HEADERS, timeout=30)
                assert resp_get.status_code == 200, f"Failed to get conversation: {resp_get.text}"
                data = resp_get.json()
                title = data.get("title")
                if title and title.strip() != "":
                    break
        
        assert title and isinstance(title, str) and len(title.strip()) > 5, "AI-generated title is missing or too short"
        
        # Step 3: Check relevance of title to conversation content (basic keyword check)
        title_lower = title.lower()
        content = " ".join(msg["content"].lower() for msg in created_conversation.get("messages", []))
        keywords = ["quantum", "cryptography", "computing"]
        matched = any(keyword in title_lower for keyword in keywords)
        assert matched, f"AI-generated title '{title}' does not seem relevant to conversation content"
        
        # Step 4: List conversations and verify the conversation with AI-generated title is present and assigned correctly
        resp_list = requests.get(f"{BASE_URL}/conversations", headers=HEADERS, timeout=30)
        assert resp_list.status_code == 200, f"Failed to list conversations: {resp_list.text}"
        conv_list = resp_list.json()
        # Find the conversation by ID
        found = False
        for conv in conv_list:
            if conv.get("id") == conversation_id:
                found = True
                assert conv.get("title") == title, "Conversation title mismatch in list"
                break
        assert found, "Created conversation not found in conversation list"
        
    finally:
        # Cleanup: delete the created conversation if possible
        if conversation_id:
            try:
                resp_del = requests.delete(f"{BASE_URL}/conversations/{conversation_id}", headers=HEADERS, timeout=30)
                assert resp_del.status_code in (200, 204), f"Failed to delete conversation: {resp_del.text}"
            except Exception:
                pass

test_ai_generated_conversation_titles()