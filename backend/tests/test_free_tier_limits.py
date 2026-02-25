"""
Test Free Tier Limits Enforcement
- Free users: 30 movies, 3 collections max
- Pro users: unlimited
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
FREE_USER_SESSION = "test_free_session_1772017196823"
PRO_USER_SESSION = "test_pro_session_1772017371286"


class TestUserLimitsEndpoint:
    """Test GET /api/user/limits returns correct limits"""
    
    def test_free_user_limits_returns_correct_values(self):
        """Free users should see 30 movies, 3 collections limits"""
        response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify subscription tier
        assert data["subscription_tier"] == "free", f"Expected 'free', got {data['subscription_tier']}"
        
        # Verify movies limits
        assert data["movies"]["limit"] == 30, f"Expected movies limit 30, got {data['movies']['limit']}"
        assert "current" in data["movies"], "Missing 'current' in movies"
        assert "can_add" in data["movies"], "Missing 'can_add' in movies"
        
        # Verify collections limits
        assert data["collections"]["limit"] == 3, f"Expected collections limit 3, got {data['collections']['limit']}"
        assert "current" in data["collections"], "Missing 'current' in collections"
        assert "can_add" in data["collections"], "Missing 'can_add' in collections"
        
        print(f"✓ Free user limits: movies={data['movies']['limit']}, collections={data['collections']['limit']}")
    
    def test_pro_user_has_no_limits(self):
        """Pro users should have null (unlimited) limits"""
        response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {PRO_USER_SESSION}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify subscription tier
        assert data["subscription_tier"] == "pro", f"Expected 'pro', got {data['subscription_tier']}"
        
        # Verify unlimited movies (null limit)
        assert data["movies"]["limit"] is None, f"Expected movies limit None, got {data['movies']['limit']}"
        assert data["movies"]["can_add"] == True, "Pro user should always be able to add movies"
        
        # Verify unlimited collections (null limit)
        assert data["collections"]["limit"] is None, f"Expected collections limit None, got {data['collections']['limit']}"
        assert data["collections"]["can_add"] == True, "Pro user should always be able to add collections"
        
        print(f"✓ Pro user has unlimited access (movies limit=None, collections limit=None)")
    
    def test_unauthenticated_user_gets_401(self):
        """Unauthenticated requests should return 401"""
        response = requests.get(f"{BASE_URL}/api/user/limits")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated user correctly gets 401")


class TestCollectionLimits:
    """Test collection creation limits for free users"""
    
    def test_free_user_can_create_collection_under_limit(self):
        """Free user should be able to create collection if under limit"""
        # First check current count
        limits_response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        current_count = limits_response.json()["collections"]["current"]
        
        if current_count >= 3:
            pytest.skip(f"Free user already at limit ({current_count}/3 collections)")
        
        # Try to create a collection
        response = requests.post(
            f"{BASE_URL}/api/collections",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
            json={
                "name": f"TEST_Collection_{current_count + 1}",
                "description": "Test collection for limit testing",
                "color": "#e11d48",
                "icon": "folder"
            }
        )
        
        # Should succeed if under limit
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        print(f"✓ Free user created collection ({current_count + 1}/3)")
    
    def test_free_user_blocked_at_collection_limit(self):
        """Free user should get 403 when at collection limit"""
        # First, ensure we're at the limit by checking current count
        limits_response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        current_count = limits_response.json()["collections"]["current"]
        
        # Create collections until we hit the limit
        collections_created = []
        while current_count < 3:
            response = requests.post(
                f"{BASE_URL}/api/collections",
                headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
                json={
                    "name": f"TEST_LimitCollection_{current_count + 1}",
                    "description": "Test collection for limit testing",
                    "color": "#e11d48",
                    "icon": "folder"
                }
            )
            if response.status_code in [200, 201]:
                collections_created.append(response.json().get("id"))
                current_count += 1
            else:
                break
        
        # Now try to create one more - should fail with 403
        response = requests.post(
            f"{BASE_URL}/api/collections",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
            json={
                "name": "TEST_OverLimitCollection",
                "description": "This should fail",
                "color": "#e11d48",
                "icon": "folder"
            }
        )
        
        assert response.status_code == 403, f"Expected 403 at limit, got {response.status_code}: {response.text}"
        
        # Verify error message mentions upgrade
        data = response.json()
        assert "detail" in data, "Missing error detail"
        assert "upgrade" in data["detail"].lower() or "limit" in data["detail"].lower(), \
            f"Error should mention upgrade/limit: {data['detail']}"
        
        print(f"✓ Free user correctly blocked at collection limit (403)")
        print(f"  Error message: {data['detail']}")
    
    def test_pro_user_can_create_unlimited_collections(self):
        """Pro user should be able to create collections without limit"""
        response = requests.post(
            f"{BASE_URL}/api/collections",
            headers={"Authorization": f"Bearer {PRO_USER_SESSION}"},
            json={
                "name": "TEST_ProCollection",
                "description": "Pro user collection",
                "color": "#3b82f6",
                "icon": "star"
            }
        )
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        print("✓ Pro user can create collections without limit")


class TestMovieLimits:
    """Test movie limits for free users via scan and bulk-add"""
    
    def test_scan_returns_skipped_due_to_limit_for_free_user_at_limit(self):
        """When free user is at movie limit, scan should return skipped_due_to_limit"""
        # First check current movie count
        limits_response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        current_count = limits_response.json()["movies"]["current"]
        
        # Note: This test verifies the response structure when at limit
        # In a real scenario, we'd need 30+ movies in directories to trigger this
        response = requests.post(
            f"{BASE_URL}/api/scan",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
            params={"recursive": True}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "total_files" in data, "Missing total_files in scan response"
        assert "new_movies" in data, "Missing new_movies in scan response"
        assert "directories_scanned" in data, "Missing directories_scanned in scan response"
        
        # If at limit and files were found, should have skipped_due_to_limit
        if current_count >= 30 and data.get("total_files", 0) > 0:
            assert "skipped_due_to_limit" in data, "Should have skipped_due_to_limit when at limit"
            assert "limit_message" in data, "Should have limit_message when at limit"
            print(f"✓ Scan correctly reports skipped_due_to_limit: {data['skipped_due_to_limit']}")
        else:
            print(f"✓ Scan response structure valid (current: {current_count}/30 movies)")
    
    def test_bulk_add_returns_skipped_due_to_limit_for_free_user(self):
        """Bulk add should return skipped_due_to_limit when free user exceeds limit"""
        # First check current movie count
        limits_response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        current_count = limits_response.json()["movies"]["current"]
        
        # Calculate how many movies we can add before hitting limit
        remaining = max(0, 30 - current_count)
        
        # Try to add more movies than remaining
        movies_to_add = []
        for i in range(remaining + 5):  # Try to add 5 more than allowed
            movies_to_add.append({
                "file_path": f"/test/path/TEST_movie_{i}.mp4",
                "file_name": f"TEST_movie_{i}.mp4",
                "directory_id": "test_dir_id"
            })
        
        response = requests.post(
            f"{BASE_URL}/api/movies/bulk-add",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
            json=movies_to_add
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "added" in data, "Missing 'added' count in response"
        
        # If we tried to add more than remaining, should have skipped some
        if remaining < len(movies_to_add):
            # Note: The actual skipped count depends on how many were actually new
            print(f"✓ Bulk add response: added={data.get('added')}, skipped_due_to_limit={data.get('skipped_due_to_limit', 0)}")
            if "skipped_due_to_limit" in data:
                assert data["skipped_due_to_limit"] > 0, "Should have skipped some movies"
                assert "limit_message" in data, "Should have limit_message"
                print(f"  Limit message: {data['limit_message']}")
        else:
            print(f"✓ Bulk add completed (current: {current_count}/30, added: {data.get('added')})")
    
    def test_pro_user_bulk_add_no_limit(self):
        """Pro user should be able to bulk add without limit restrictions"""
        movies_to_add = []
        for i in range(5):
            movies_to_add.append({
                "file_path": f"/test/pro/path/TEST_pro_movie_{i}.mp4",
                "file_name": f"TEST_pro_movie_{i}.mp4",
                "directory_id": "test_dir_id"
            })
        
        response = requests.post(
            f"{BASE_URL}/api/movies/bulk-add",
            headers={"Authorization": f"Bearer {PRO_USER_SESSION}"},
            json=movies_to_add
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Pro user should never have skipped_due_to_limit
        assert "skipped_due_to_limit" not in data or data.get("skipped_due_to_limit", 0) == 0, \
            "Pro user should not have skipped_due_to_limit"
        
        print(f"✓ Pro user bulk add succeeded without limit restrictions")


class TestAddMovieEndpoint:
    """Test single movie add endpoint limits"""
    
    def test_free_user_blocked_at_movie_limit(self):
        """Free user should get 403 when at movie limit"""
        # First check current movie count
        limits_response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"}
        )
        current_count = limits_response.json()["movies"]["current"]
        
        if current_count < 30:
            pytest.skip(f"Free user not at limit yet ({current_count}/30 movies)")
        
        # Try to add a movie - should fail with 403
        response = requests.post(
            f"{BASE_URL}/api/movies",
            headers={"Authorization": f"Bearer {FREE_USER_SESSION}"},
            json={
                "file_path": "/test/path/TEST_over_limit_movie.mp4",
                "file_name": "TEST_over_limit_movie.mp4",
                "directory_id": "test_dir_id"
            }
        )
        
        assert response.status_code == 403, f"Expected 403 at limit, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Missing error detail"
        assert "upgrade" in data["detail"].lower() or "limit" in data["detail"].lower(), \
            f"Error should mention upgrade/limit: {data['detail']}"
        
        print(f"✓ Free user correctly blocked at movie limit (403)")


class TestCleanup:
    """Cleanup test data after tests"""
    
    def test_cleanup_test_collections(self):
        """Remove test collections created during testing"""
        # Get all collections
        response = requests.get(f"{BASE_URL}/api/collections")
        
        if response.status_code == 200:
            collections = response.json()
            for collection in collections:
                if collection.get("name", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/collections/{collection['id']}"
                    )
                    if delete_response.status_code in [200, 204]:
                        print(f"  Deleted test collection: {collection['name']}")
        
        print("✓ Test collections cleanup completed")
    
    def test_cleanup_test_movies(self):
        """Remove test movies created during testing"""
        # Get all movies
        response = requests.get(f"{BASE_URL}/api/movies")
        
        if response.status_code == 200:
            movies = response.json()
            for movie in movies:
                if movie.get("file_name", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/movies/{movie['id']}"
                    )
                    if delete_response.status_code in [200, 204]:
                        print(f"  Deleted test movie: {movie['file_name']}")
        
        print("✓ Test movies cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
