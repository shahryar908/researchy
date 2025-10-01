import requests

BASE_URL = "http://localhost:8000"

# Set a valid token here for testing purpose
TOKEN = "YOUR_VALID_TOKEN_HERE"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TOKEN}"
}

def test_user_authentication_and_session_management():
    # 1. SESSION MANAGEMENT - Get current session/user info
    session_url = f"{BASE_URL}/auth/session"
    try:
        session_response = requests.get(session_url, headers=headers, timeout=30)
        assert session_response.status_code == 200, f"Fetching session failed: {session_response.text}"
        session_data = session_response.json()
        assert "user" in session_data, "Session response missing user info"
        user = session_data["user"]
        assert user.get("email") == "testuser@example.com", "Session email does not match signed in user"
    except requests.RequestException as e:
        assert False, f"Session request failed: {e}"

    # 2. SESSION MANAGEMENT - Verify access to protected resource
    protected_url = f"{BASE_URL}/user/profile"
    try:
        protected_response = requests.get(protected_url, headers=headers, timeout=30)
        assert protected_response.status_code == 200, f"Accessing protected resource failed: {protected_response.text}"
        profile_data = protected_response.json()
        assert "email" in profile_data and profile_data["email"] == "testuser@example.com", "Incorrect profile info returned"
    except requests.RequestException as e:
        assert False, f"Protected resource request failed: {e}"

    # 3. SIGN OUT (Invalidate session/token)
    signout_url = f"{BASE_URL}/auth/signout"
    try:
        signout_response = requests.post(signout_url, headers=headers, timeout=30)
        assert signout_response.status_code == 204 or signout_response.status_code == 200, f"Sign out failed: {signout_response.text}"
    except requests.RequestException as e:
        assert False, f"Sign out request failed: {e}"

    # 4. Verify token invalidation - access protected resource after sign out should fail
    try:
        invalid_access_response = requests.get(protected_url, headers=headers, timeout=30)
        assert invalid_access_response.status_code == 401 or invalid_access_response.status_code == 403, "Access with signed-out token did not fail as expected"
    except requests.RequestException as e:
        assert False, f"Request after sign out failed unexpectedly: {e}"

test_user_authentication_and_session_management()
