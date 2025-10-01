import requests

BASE_URL = "http://localhost:8000"
TOKEN = ("eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDExMUFBQSIsImtpZCI6Imluc18zM08zYm5uNURIT1"
         "AwaG1YNENUM0x6V2sxaXEiLCJ0eXAiOiJKV1QifQ.eyJhenAiOiJodHRwOi8vbG9jYWxob3N0OjMwMDAiLCJleHAiOjE3NTkxODY2NjksImZ2YSI6WzkzLC0xXSwiaWF0IjoxNzU5MTg2NjA5LCJpc3MiOiJodHRwczovL3Rob3JvdWdoLWdyYWNrbGUtNTUuY2xlcmsuYWNjb3VudHMuZGV2IiwibmJmIjoxNzU5MTg2NTk5LCJzaWQiOiJzZXNzXzMzT0g3QWp6YktGcHJ5allhSDZXc0V2anVCTSIsInN0cyI6ImFjdGl2ZSIsInN1YiI6InVzZXJfMzNPSDdGSFBtZTI1NTd5RVU3clNtRzR5bTVWIiwidiI6Mn0.IAf7O59G87Imp2MtqrmvT8ot0MRIsAM0PVuzBh-O7M8ox2Q1N1iXh8c_g4Uej15ruvGOqJYf5y7g153Ov_1gMFuiWcTzqSPM95Kb7btlOy2z_ydJ5sEyecJDimCa8Ncz4rUlqTA8mEJMpiS_IV9YnvHIQAs_cbTPDUNuPT0ZsyCHC88qpkX_FYXT-72yDLGGJ0P90szxBSvn8NN5AXs-fYWiLHn3HOGy58gkQVXzRePpEbIKmdi_jNkot73p0m6ZGZivUUA0fXIk9_TpRBifsfpHRUrqt7YPkKbqDZawUbJKW2uC1-UKMfNEeIm6v5zgjGaqrkerXeKxe-woWXyzJw")

def test_academic_paper_search_with_arxiv_api():
    """
    Test the academic paper search endpoint with filtering by category and sorting.
    Validates that the response returns papers matching the category filter and sorted correctly.
    """
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/json"
    }

    # Example query params:
    # - search query: "machine learning"
    # - filter category: cs.LG (Computer Science - Machine Learning)
    # - sort by: submittedDate (descending)
    params = {
        "query": "machine learning",
        "category": "cs.LG",
        "sort": "submittedDate",
        "order": "desc",
        "max_results": "10"
    }

    try:
        response = requests.get(
            f"{BASE_URL}/api/arxiv/search",
            headers=headers,
            params=params,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Request to arxiv search endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Expecting a list of papers in 'results'
    assert "results" in data, "Response JSON missing 'results' key"
    results = data["results"]
    assert isinstance(results, list), "'results' should be a list"
    assert len(results) > 0, "No papers returned in results"

    # Validate filter by category and sort order descending by submittedDate
    # Each item should have 'categories' list or string containing 'cs.LG' and a 'submittedDate' field
    previous_date = None
    for paper in results:
        # Check required keys
        assert "categories" in paper, "Paper missing 'categories' key"
        assert "submittedDate" in paper, "Paper missing 'submittedDate' key"

        categories = paper["categories"]
        if isinstance(categories, str):
            categories = [c.strip() for c in categories.split()]
        assert "cs.LG" in categories, f"Paper categories {categories} does not include 'cs.LG'"

        # Validate sorting by submittedDate (descending)
        current_date = paper["submittedDate"]
        if previous_date is not None:
            assert current_date <= previous_date, ("Papers are not sorted correctly by submittedDate descending - "
                                                  f"{current_date} !<= {previous_date}")
        previous_date = current_date


test_academic_paper_search_with_arxiv_api()