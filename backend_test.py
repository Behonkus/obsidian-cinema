#!/usr/bin/env python3
"""
Backend API Testing for Obsidian Cinema
Tests all CRUD operations for directories and movies
"""

import requests
import sys
import json
from datetime import datetime

class ObsidianCinemaAPITester:
    def __init__(self, base_url="https://cinema-library-dev.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {"directories": [], "movies": [], "collections": []}

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Response ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_config_endpoint(self):
        """Test config endpoint"""
        return self.run_test("API Config", "GET", "config", 200)

    def test_create_directory(self, path, name=None):
        """Test creating a directory"""
        data = {"path": path}
        if name:
            data["name"] = name
        
        success, response = self.run_test(
            f"Create Directory ({path})",
            "POST",
            "directories",
            200,
            data=data
        )
        
        if success and 'id' in response:
            self.created_resources["directories"].append(response['id'])
            return response['id']
        return None

    def test_get_directories(self):
        """Test getting all directories"""
        return self.run_test("Get Directories", "GET", "directories", 200)

    def test_delete_directory(self, directory_id):
        """Test deleting a directory"""
        success, _ = self.run_test(
            f"Delete Directory ({directory_id})",
            "DELETE",
            f"directories/{directory_id}",
            200
        )
        if success and directory_id in self.created_resources["directories"]:
            self.created_resources["directories"].remove(directory_id)
        return success

    def test_bulk_add_movies(self, directory_id):
        """Test bulk adding movies"""
        movies_data = [
            {
                "file_path": "C:\\Movies\\Inception (2010).mkv",
                "file_name": "Inception (2010).mkv",
                "directory_id": directory_id
            },
            {
                "file_path": "C:\\Movies\\The Matrix (1999).mp4",
                "file_name": "The Matrix (1999).mp4", 
                "directory_id": directory_id
            },
            {
                "file_path": "/home/user/movies/Avatar (2009).avi",
                "file_name": "Avatar (2009).avi",
                "directory_id": directory_id
            }
        ]
        
        success, response = self.run_test(
            "Bulk Add Movies",
            "POST",
            "movies/bulk-add",
            200,
            data=movies_data
        )
        
        if success and 'movies' in response:
            for movie in response['movies']:
                if isinstance(movie, dict) and 'id' in movie:
                    self.created_resources["movies"].append(movie['id'])
        
        return success, response

    def test_get_movies(self):
        """Test getting all movies"""
        return self.run_test("Get Movies", "GET", "movies", 200)

    def test_get_movies_with_filters(self):
        """Test getting movies with filters"""
        # Test search filter
        success1, _ = self.run_test(
            "Get Movies (Search Filter)",
            "GET", 
            "movies",
            200,
            params={"search": "inception"}
        )
        
        # Test metadata filter
        success2, _ = self.run_test(
            "Get Movies (Metadata Filter)",
            "GET",
            "movies", 
            200,
            params={"has_metadata": False}
        )
        
        return success1 and success2

    def test_get_single_movie(self, movie_id):
        """Test getting a single movie by ID"""
        return self.run_test(
            f"Get Movie ({movie_id})",
            "GET",
            f"movies/{movie_id}",
            200
        )

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        return self.run_test("Get Stats", "GET", "stats", 200)

    def test_validate_directory(self, path):
        """Test directory path validation"""
        return self.run_test(
            f"Validate Directory ({path})",
            "POST",
            f"directories/validate?path={path}",
            200
        )

    def test_scan_single_directory(self, directory_id):
        """Test scanning a single directory"""
        return self.run_test(
            f"Scan Single Directory ({directory_id})",
            "POST",
            f"directories/{directory_id}/scan?recursive=true",
            200
        )

    def test_scan_directories(self):
        """Test directory scanning (all directories)"""
        return self.run_test("Scan All Directories", "POST", "scan?recursive=true", 200)

    def test_fetch_metadata_without_api_key(self, movie_id):
        """Test fetching metadata without TMDB API key (should fail gracefully)"""
        success, response = self.run_test(
            "Fetch Metadata (No API Key)",
            "POST",
            f"movies/{movie_id}/fetch-metadata",
            400  # Should return 400 when no API key
        )
        return success

    def test_get_settings(self):
        """Test getting current settings"""
        return self.run_test("Get Settings", "GET", "settings", 200)

    def test_test_tmdb_key_invalid(self):
        """Test TMDB key validation with invalid key"""
        success, response = self.run_test(
            "Test Invalid TMDB Key",
            "POST",
            "settings/test-tmdb?api_key=invalid_key_12345",
            200  # Endpoint returns 200 with valid/invalid flag
        )
        
        if success and isinstance(response, dict):
            if response.get('valid') == False:
                print(f"   ✅ Correctly identified invalid key: {response.get('message', 'No message')}")
                return True
            else:
                print(f"   ❌ Expected invalid key to be rejected, got: {response}")
                return False
        return success

    def test_save_settings_invalid_key(self):
        """Test saving invalid TMDB API key (should fail)"""
        success, response = self.run_test(
            "Save Invalid TMDB Key",
            "POST",
            "settings",
            400,  # Should return 400 for invalid key
            data={"tmdb_api_key": "invalid_key_12345"}
        )
        return success

    def test_save_settings_empty_key(self):
        """Test saving empty TMDB API key"""
        success, response = self.run_test(
            "Save Empty TMDB Key",
            "POST",
            "settings",
            200,  # Should succeed with empty key
            data={"tmdb_api_key": ""}
        )
        return success

    def test_movie_favorite_toggle(self, movie_id):
        """Test toggling favorite status for a movie"""
        # First toggle to favorite
        success1, response1 = self.run_test(
            f"Toggle Movie Favorite ON ({movie_id})",
            "POST",
            f"movies/{movie_id}/favorite",
            200
        )
        
        if success1 and isinstance(response1, dict):
            print(f"   Favorite status: {response1.get('is_favorite', 'unknown')}")
        
        # Toggle back to not favorite
        success2, response2 = self.run_test(
            f"Toggle Movie Favorite OFF ({movie_id})",
            "POST",
            f"movies/{movie_id}/favorite",
            200
        )
        
        if success2 and isinstance(response2, dict):
            print(f"   Favorite status: {response2.get('is_favorite', 'unknown')}")
        
        return success1 and success2

    def test_movie_watchlist_toggle(self, movie_id):
        """Test toggling watchlist status for a movie"""
        # First toggle to watchlist
        success1, response1 = self.run_test(
            f"Toggle Movie Watchlist ON ({movie_id})",
            "POST",
            f"movies/{movie_id}/watchlist",
            200
        )
        
        if success1 and isinstance(response1, dict):
            print(f"   Watchlist status: {response1.get('is_watchlist', 'unknown')}")
        
        # Toggle back to not in watchlist
        success2, response2 = self.run_test(
            f"Toggle Movie Watchlist OFF ({movie_id})",
            "POST",
            f"movies/{movie_id}/watchlist",
            200
        )
        
        if success2 and isinstance(response2, dict):
            print(f"   Watchlist status: {response2.get('is_watchlist', 'unknown')}")
        
        return success1 and success2

    def test_movie_watched_toggle(self, movie_id):
        """Test toggling watched status for a movie"""
        # First toggle to watched
        success1, response1 = self.run_test(
            f"Toggle Movie Watched ON ({movie_id})",
            "POST",
            f"movies/{movie_id}/watched",
            200
        )
        
        if success1 and isinstance(response1, dict):
            print(f"   Watched status: {response1.get('watched', 'unknown')}")
        
        # Toggle back to not watched
        success2, response2 = self.run_test(
            f"Toggle Movie Watched OFF ({movie_id})",
            "POST",
            f"movies/{movie_id}/watched",
            200
        )
        
        if success2 and isinstance(response2, dict):
            print(f"   Watched status: {response2.get('watched', 'unknown')}")
        
        return success1 and success2

    def test_movies_with_list_filters(self):
        """Test getting movies with list filters (favorites, watchlist, watched)"""
        # Test favorites filter
        success1, response1 = self.run_test(
            "Get Movies (Favorites Filter)",
            "GET", 
            "movies",
            200,
            params={"is_favorite": True}
        )
        
        # Test watchlist filter
        success2, response2 = self.run_test(
            "Get Movies (Watchlist Filter)",
            "GET",
            "movies", 
            200,
            params={"is_watchlist": True}
        )
        
        # Test watched filter
        success3, response3 = self.run_test(
            "Get Movies (Watched Filter)",
            "GET",
            "movies", 
            200,
            params={"watched": True}
        )
        
        return success1 and success2 and success3

    def test_movies_sorting(self):
        """Test movie sorting functionality - NEW FEATURE"""
        print("\n🔍 Testing Movie Sorting Feature...")
        
        # Test default sorting (should be created_at desc - Recently Added)
        success1, response1 = self.run_test(
            "Get Movies (Default Sort - Recently Added)",
            "GET",
            "movies",
            200
        )
        
        # Test sort by title ascending (A-Z)
        success2, response2 = self.run_test(
            "Get Movies (Sort Title A-Z)",
            "GET",
            "movies",
            200,
            params={"sort_by": "title", "sort_order": "asc"}
        )
        
        # Test sort by title descending (Z-A)
        success3, response3 = self.run_test(
            "Get Movies (Sort Title Z-A)",
            "GET",
            "movies",
            200,
            params={"sort_by": "title", "sort_order": "desc"}
        )
        
        # Test sort by year ascending (oldest first)
        success4, response4 = self.run_test(
            "Get Movies (Sort Year Oldest)",
            "GET",
            "movies",
            200,
            params={"sort_by": "year", "sort_order": "asc"}
        )
        
        # Test sort by year descending (newest first)
        success5, response5 = self.run_test(
            "Get Movies (Sort Year Newest)",
            "GET",
            "movies",
            200,
            params={"sort_by": "year", "sort_order": "desc"}
        )
        
        # Test sort by rating ascending (low to high)
        success6, response6 = self.run_test(
            "Get Movies (Sort Rating Low to High)",
            "GET",
            "movies",
            200,
            params={"sort_by": "rating", "sort_order": "asc"}
        )
        
        # Test sort by rating descending (high to low)
        success7, response7 = self.run_test(
            "Get Movies (Sort Rating High to Low)",
            "GET",
            "movies",
            200,
            params={"sort_by": "rating", "sort_order": "desc"}
        )
        
        # Test sort by created_at ascending (oldest added)
        success8, response8 = self.run_test(
            "Get Movies (Sort Oldest Added)",
            "GET",
            "movies",
            200,
            params={"sort_by": "created_at", "sort_order": "asc"}
        )
        
        # Test sort by created_at descending (recently added)
        success9, response9 = self.run_test(
            "Get Movies (Sort Recently Added)",
            "GET",
            "movies",
            200,
            params={"sort_by": "created_at", "sort_order": "desc"}
        )
        
        # Validate that responses contain movies and are properly sorted
        all_success = all([success1, success2, success3, success4, success5, success6, success7, success8, success9])
        
        if all_success:
            # Check if we have movies to validate sorting
            if isinstance(response2, list) and len(response2) >= 2:
                # Validate title sorting A-Z
                titles_asc = [movie.get('title', movie.get('file_name', '')) for movie in response2]
                is_title_asc_sorted = all(titles_asc[i] <= titles_asc[i+1] for i in range(len(titles_asc)-1))
                print(f"   Title A-Z sorting validation: {'✅' if is_title_asc_sorted else '❌'}")
                
                # Validate title sorting Z-A
                if isinstance(response3, list) and len(response3) >= 2:
                    titles_desc = [movie.get('title', movie.get('file_name', '')) for movie in response3]
                    is_title_desc_sorted = all(titles_desc[i] >= titles_desc[i+1] for i in range(len(titles_desc)-1))
                    print(f"   Title Z-A sorting validation: {'✅' if is_title_desc_sorted else '❌'}")
            else:
                print("   ⚠️ Not enough movies to validate sorting order")
        
        return all_success

    def test_poster_repository_endpoint(self):
        """Test poster repository serving endpoint (should return 404 for non-existent poster)"""
        success, response = self.run_test(
            "Get Non-existent Poster",
            "GET",
            "posters/w500/nonexistent.jpg",
            404  # Should return 404 for non-existent poster
        )
        return success

    def test_settings_poster_info(self):
        """Test that settings endpoint returns poster repository information"""
        success, response = self.run_test(
            "Get Settings (Poster Info)",
            "GET",
            "settings",
            200
        )
        
        if success and isinstance(response, dict):
            has_poster_repo_dir = 'poster_repo_dir' in response
            has_cached_posters = 'cached_posters' in response
            
            print(f"   Has poster_repo_dir: {has_poster_repo_dir}")
            print(f"   Has cached_posters: {has_cached_posters}")
            print(f"   Poster repo dir: {response.get('poster_repo_dir', 'Not found')}")
            print(f"   Cached posters count: {response.get('cached_posters', 'Not found')}")
            
            return has_poster_repo_dir and has_cached_posters
        
        return success

    def test_stats_with_lists(self):
        """Test that stats endpoint returns favorites, watchlist, and watched counts"""
        success, response = self.run_test(
            "Get Stats (With Lists)",
            "GET",
            "stats",
            200
        )
        
        if success and isinstance(response, dict):
            has_favorites = 'favorites' in response
            has_watchlist = 'watchlist' in response
            has_watched = 'watched' in response
            
            print(f"   Has favorites count: {has_favorites}")
            print(f"   Has watchlist count: {has_watchlist}")
            print(f"   Has watched count: {has_watched}")
            print(f"   Favorites: {response.get('favorites', 'Not found')}")
            print(f"   Watchlist: {response.get('watchlist', 'Not found')}")
            print(f"   Watched: {response.get('watched', 'Not found')}")
            
            return has_favorites and has_watchlist and has_watched
        
        return success

    # Collections API Tests
    def test_create_collection(self, name, description=None, color=None):
        """Test creating a collection"""
        data = {"name": name}
        if description:
            data["description"] = description
        if color:
            data["color"] = color
        
        success, response = self.run_test(
            f"Create Collection ({name})",
            "POST",
            "collections",
            200,
            data=data
        )
        
        if success and 'id' in response:
            self.created_resources["collections"].append(response['id'])
            return response['id']
        return None

    def test_get_collections(self):
        """Test getting all collections"""
        return self.run_test("Get Collections", "GET", "collections", 200)

    def test_get_single_collection(self, collection_id):
        """Test getting a single collection by ID"""
        return self.run_test(
            f"Get Collection ({collection_id})",
            "GET",
            f"collections/{collection_id}",
            200
        )

    def test_update_collection(self, collection_id, name=None, description=None, color=None):
        """Test updating a collection"""
        data = {}
        if name:
            data["name"] = name
        if description is not None:
            data["description"] = description
        if color:
            data["color"] = color
        
        return self.run_test(
            f"Update Collection ({collection_id})",
            "PUT",
            f"collections/{collection_id}",
            200,
            data=data
        )

    def test_add_movie_to_collection(self, collection_id, movie_id):
        """Test adding a movie to a collection"""
        return self.run_test(
            f"Add Movie to Collection ({collection_id}, {movie_id})",
            "POST",
            f"collections/{collection_id}/movies/{movie_id}",
            200
        )

    def test_remove_movie_from_collection(self, collection_id, movie_id):
        """Test removing a movie from a collection"""
        return self.run_test(
            f"Remove Movie from Collection ({collection_id}, {movie_id})",
            "DELETE",
            f"collections/{collection_id}/movies/{movie_id}",
            200
        )

    def test_get_collection_movies(self, collection_id):
        """Test getting all movies in a collection"""
        return self.run_test(
            f"Get Collection Movies ({collection_id})",
            "GET",
            f"collections/{collection_id}/movies",
            200
        )

    def test_get_movies_by_collection_filter(self, collection_id):
        """Test filtering movies by collection ID"""
        return self.run_test(
            f"Get Movies (Collection Filter: {collection_id})",
            "GET",
            "movies",
            200,
            params={"collection_id": collection_id}
        )

    def test_delete_collection(self, collection_id):
        """Test deleting a collection"""
        success, _ = self.run_test(
            f"Delete Collection ({collection_id})",
            "DELETE",
            f"collections/{collection_id}",
            200
        )
        if success and collection_id in self.created_resources["collections"]:
            self.created_resources["collections"].remove(collection_id)
        return success

    def test_stats_with_collections(self):
        """Test that stats endpoint returns collections count"""
        success, response = self.run_test(
            "Get Stats (With Collections)",
            "GET",
            "stats",
            200
        )
        
        if success and isinstance(response, dict):
            has_collections = 'total_collections' in response
            
            print(f"   Has total_collections count: {has_collections}")
            print(f"   Total collections: {response.get('total_collections', 'Not found')}")
            
            return has_collections
        
        return success

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete collections first (they reference movies)
        for collection_id in self.created_resources["collections"]:
            try:
                response = requests.delete(f"{self.base_url}/collections/{collection_id}", timeout=5)
                if response.status_code == 200:
                    print(f"   ✅ Deleted collection {collection_id}")
                else:
                    print(f"   ⚠️ Failed to delete collection {collection_id}")
            except Exception as e:
                print(f"   ⚠️ Error deleting collection {collection_id}: {e}")
        
        # Delete movies (they depend on directories)
        for movie_id in self.created_resources["movies"]:
            try:
                response = requests.delete(f"{self.base_url}/movies/{movie_id}", timeout=5)
                if response.status_code == 200:
                    print(f"   ✅ Deleted movie {movie_id}")
                else:
                    print(f"   ⚠️ Failed to delete movie {movie_id}")
            except Exception as e:
                print(f"   ⚠️ Error deleting movie {movie_id}: {e}")
        
        # Delete directories
        for dir_id in self.created_resources["directories"]:
            try:
                response = requests.delete(f"{self.base_url}/directories/{dir_id}", timeout=5)
                if response.status_code == 200:
                    print(f"   ✅ Deleted directory {dir_id}")
                else:
                    print(f"   ⚠️ Failed to delete directory {dir_id}")
            except Exception as e:
                print(f"   ⚠️ Error deleting directory {dir_id}: {e}")

def main():
    print("🎬 Starting Obsidian Cinema API Tests")
    print("=" * 50)
    
    tester = ObsidianCinemaAPITester()
    
    try:
        # Test basic endpoints
        tester.test_root_endpoint()
        tester.test_config_endpoint()
        tester.test_stats_endpoint()
        
        # Test directory validation (new feature)
        print("\n🔍 Testing Directory Validation...")
        tester.test_validate_directory("C:\\TestMovies")  # Local path
        tester.test_validate_directory("\\\\server\\share\\movies")  # Network UNC path
        tester.test_validate_directory("//nas/media/films")  # Network forward slash path
        tester.test_validate_directory("/nonexistent/path")  # Invalid path
        
        # Test directory operations
        test_dir_name = f"TestMovies_{datetime.now().strftime('%H%M%S')}"
        dir_id = tester.test_create_directory(f"C:\\{test_dir_name}", "Test Movies Directory")
        if not dir_id:
            print("❌ Failed to create directory, stopping tests")
            return 1
        
        tester.test_get_directories()
        
        # Test single directory scanning (new feature)
        print("\n🔍 Testing Single Directory Scanning...")
        tester.test_scan_single_directory(dir_id)
        
        # Test movie operations
        success, movies_response = tester.test_bulk_add_movies(dir_id)
        if not success:
            print("❌ Failed to add movies, stopping tests")
            return 1
        
        tester.test_get_movies()
        tester.test_get_movies_with_filters()
        
        # Test NEW FEATURE: Movie Sorting
        print("\n🔍 Testing Movie Sorting Feature...")
        tester.test_movies_sorting()
        
        # Test single movie operations if we have movies
        if tester.created_resources["movies"]:
            movie_id = tester.created_resources["movies"][0]
            tester.test_get_single_movie(movie_id)
            tester.test_fetch_metadata_without_api_key(movie_id)
            
            # Test NEW FEATURES: Favorites, Watchlist, Watched toggles
            print("\n🔍 Testing Movie List Features...")
            tester.test_movie_favorite_toggle(movie_id)
            tester.test_movie_watchlist_toggle(movie_id)
            tester.test_movie_watched_toggle(movie_id)
            
            # Test movie filtering with list filters
            tester.test_movies_with_list_filters()
        
        # Test NEW FEATURE: Collections API
        print("\n🔍 Testing Collections API...")
        
        # Create test collections
        collection1_id = tester.test_create_collection(
            "Action Movies", 
            "High-octane action films", 
            "#e11d48"
        )
        collection2_id = tester.test_create_collection(
            "Sci-Fi Collection",
            "Science fiction movies",
            "#2563eb"
        )
        
        if collection1_id and collection2_id:
            # Test getting collections
            tester.test_get_collections()
            tester.test_get_single_collection(collection1_id)
            
            # Test updating collection
            tester.test_update_collection(
                collection1_id, 
                name="Updated Action Movies",
                description="Updated description",
                color="#16a34a"
            )
            
            # Test adding movies to collections (if we have movies)
            if tester.created_resources["movies"]:
                movie_id = tester.created_resources["movies"][0]
                
                # Add movie to collection
                tester.test_add_movie_to_collection(collection1_id, movie_id)
                
                # Test getting collection movies
                tester.test_get_collection_movies(collection1_id)
                
                # Test filtering movies by collection
                tester.test_get_movies_by_collection_filter(collection1_id)
                
                # Test removing movie from collection
                tester.test_remove_movie_from_collection(collection1_id, movie_id)
                
                # Verify movie was removed
                tester.test_get_collection_movies(collection1_id)
            
            # Test stats with collections
            tester.test_stats_with_collections()
        
        # Test scan functionality (updated for recursive scanning)
        print("\n🔍 Testing All Directory Scanning...")
        tester.test_scan_directories()
        
        # Test stats after adding data (should include new list counts)
        print("\n🔍 Testing Stats with List Counts...")
        tester.test_stats_with_lists()
        
        # Test Settings endpoints (UPDATED FEATURE)
        print("\n🔍 Testing Settings Endpoints...")
        tester.test_get_settings()
        tester.test_settings_poster_info()  # NEW: Test poster repository info
        tester.test_test_tmdb_key_invalid()
        tester.test_save_settings_invalid_key()
        tester.test_save_settings_empty_key()
        
        # Test NEW FEATURE: Poster Repository
        print("\n🔍 Testing Poster Repository...")
        tester.test_poster_repository_endpoint()
        
        # Test duplicate directory creation (should fail)
        tester.run_test(
            "Create Duplicate Directory",
            "POST",
            "directories",
            400,  # Should fail with 400
            data={"path": f"C:\\{test_dir_name}", "name": "Duplicate"}
        )
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        # Always cleanup
        tester.cleanup_resources()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())