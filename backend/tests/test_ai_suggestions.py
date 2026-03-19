"""
Tests for POST /api/ai/suggestions - AI-powered movie suggestion feature
This endpoint uses GPT-4.1-mini via Emergent LLM key to suggest similar movies from user's library.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Sample test movies with varied genres for testing AI suggestions
SAMPLE_LIBRARY = [
    {
        "id": "movie_001",
        "title": "Inception",
        "year": 2010,
        "genres": ["Sci-Fi", "Action", "Thriller"],
        "overview": "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.",
        "rating": 8.8
    },
    {
        "id": "movie_002",
        "title": "The Matrix",
        "year": 1999,
        "genres": ["Sci-Fi", "Action"],
        "overview": "A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
        "rating": 8.7
    },
    {
        "id": "movie_003",
        "title": "Interstellar",
        "year": 2014,
        "genres": ["Sci-Fi", "Drama", "Adventure"],
        "overview": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        "rating": 8.6
    },
    {
        "id": "movie_004",
        "title": "The Dark Knight",
        "year": 2008,
        "genres": ["Action", "Crime", "Drama"],
        "overview": "Batman must face the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.",
        "rating": 9.0
    },
    {
        "id": "movie_005",
        "title": "Pulp Fiction",
        "year": 1994,
        "genres": ["Crime", "Drama"],
        "overview": "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
        "rating": 8.9
    },
    {
        "id": "movie_006",
        "title": "The Shawshank Redemption",
        "year": 1994,
        "genres": ["Drama"],
        "overview": "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
        "rating": 9.3
    },
    {
        "id": "movie_007",
        "title": "Superbad",
        "year": 2007,
        "genres": ["Comedy"],
        "overview": "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-fueled party goes awry.",
        "rating": 7.6
    }
]


class TestAISuggestionsEndpoint:
    """Test cases for POST /api/ai/suggestions endpoint"""

    def test_ai_suggestions_with_valid_data(self):
        """Test that the endpoint returns suggestions with valid movie data and library"""
        selected_movie = SAMPLE_LIBRARY[0]  # Inception
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": SAMPLE_LIBRARY
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60  # AI calls can take time
        )
        
        # Check status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "suggestions" in data, "Response should contain 'suggestions' key"
        assert isinstance(data["suggestions"], list), "Suggestions should be a list"
        
        # If we have suggestions, validate their structure
        if len(data["suggestions"]) > 0:
            for suggestion in data["suggestions"]:
                assert "id" in suggestion, "Each suggestion should have 'id'"
                assert "title" in suggestion, "Each suggestion should have 'title'"
                assert "reason" in suggestion, "Each suggestion should have 'reason'"
                assert isinstance(suggestion["id"], str), "id should be a string"
                assert isinstance(suggestion["title"], str), "title should be a string"
                assert isinstance(suggestion["reason"], str), "reason should be a string"
        
        print(f"✓ AI returned {len(data['suggestions'])} suggestions")
        for s in data["suggestions"]:
            print(f"  - {s['title']}: {s['reason']}")

    def test_selected_movie_excluded_from_suggestions(self):
        """Test that the selected movie is NOT included in the suggestions"""
        selected_movie = SAMPLE_LIBRARY[0]  # Inception
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": SAMPLE_LIBRARY
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Ensure selected movie is not in suggestions
        suggestion_ids = [s["id"] for s in data["suggestions"]]
        assert selected_movie["id"] not in suggestion_ids, \
            f"Selected movie '{selected_movie['title']}' should not appear in suggestions"
        
        print(f"✓ Selected movie '{selected_movie['title']}' correctly excluded from {len(suggestion_ids)} suggestions")

    def test_single_movie_library_returns_empty_suggestions(self):
        """Test that with only 1 movie in library (no candidates), suggestions are empty"""
        single_movie = SAMPLE_LIBRARY[0]
        
        payload = {
            "selected_movie": single_movie,
            "library_movies": [single_movie]  # Only 1 movie = no candidates
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "suggestions" in data
        assert len(data["suggestions"]) == 0, \
            f"Expected empty suggestions for single-movie library, got {len(data['suggestions'])}"
        
        print("✓ Single-movie library correctly returns empty suggestions")

    def test_missing_optional_fields_still_works(self):
        """Test that movies with missing genres/overview still get processed"""
        # Movie with minimal data
        minimal_movie = {
            "id": "minimal_001",
            "title": "Some Movie"
            # No year, genres, overview, or rating
        }
        
        # Library with mix of complete and minimal data
        mixed_library = [
            minimal_movie,
            {"id": "min_002", "title": "Another Film"},
            {"id": "min_003", "title": "Third Movie", "year": 2020}
        ]
        
        payload = {
            "selected_movie": minimal_movie,
            "library_movies": mixed_library
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60
        )
        
        # Should still work, not fail
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "suggestions" in data
        
        print(f"✓ Endpoint handles movies with missing optional fields (returned {len(data['suggestions'])} suggestions)")

    def test_response_format_validation(self):
        """Test that each suggestion has required fields: id, title, reason"""
        selected_movie = SAMPLE_LIBRARY[3]  # The Dark Knight
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": SAMPLE_LIBRARY
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response format
        assert "suggestions" in data
        
        for i, suggestion in enumerate(data["suggestions"]):
            assert "id" in suggestion, f"Suggestion {i} missing 'id'"
            assert "title" in suggestion, f"Suggestion {i} missing 'title'"
            assert "reason" in suggestion, f"Suggestion {i} missing 'reason'"
            
            # Validate types
            assert isinstance(suggestion["id"], str), f"Suggestion {i} 'id' should be string"
            assert isinstance(suggestion["title"], str), f"Suggestion {i} 'title' should be string"
            assert isinstance(suggestion["reason"], str), f"Suggestion {i} 'reason' should be string"
            
            # Reason should be a meaningful sentence
            assert len(suggestion["reason"]) > 5, f"Suggestion {i} reason too short"
        
        print(f"✓ All {len(data['suggestions'])} suggestions have valid format (id, title, reason)")

    def test_suggestions_are_from_library(self):
        """Test that all returned suggestions are actually from the provided library"""
        selected_movie = SAMPLE_LIBRARY[1]  # The Matrix
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": SAMPLE_LIBRARY
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        library_ids = {m["id"] for m in SAMPLE_LIBRARY if m["id"] != selected_movie["id"]}
        
        for suggestion in data["suggestions"]:
            assert suggestion["id"] in library_ids, \
                f"Suggestion '{suggestion['title']}' (id: {suggestion['id']}) is not from the provided library"
        
        print(f"✓ All {len(data['suggestions'])} suggestions verified to be from library")

    def test_max_five_suggestions(self):
        """Test that the endpoint returns at most 5 suggestions"""
        selected_movie = SAMPLE_LIBRARY[0]
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": SAMPLE_LIBRARY
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["suggestions"]) <= 5, \
            f"Expected at most 5 suggestions, got {len(data['suggestions'])}"
        
        print(f"✓ Suggestions limited to max 5 (returned {len(data['suggestions'])})")

    def test_empty_library_returns_empty_suggestions(self):
        """Test that an empty library returns empty suggestions"""
        selected_movie = SAMPLE_LIBRARY[0]
        
        payload = {
            "selected_movie": selected_movie,
            "library_movies": []  # Empty library
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["suggestions"]) == 0
        
        print("✓ Empty library correctly returns empty suggestions")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
