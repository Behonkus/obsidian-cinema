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
    def __init__(self, base_url="https://movieposter.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {"directories": [], "movies": []}

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

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete movies first (they depend on directories)
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
        
        # Test single movie operations if we have movies
        if tester.created_resources["movies"]:
            movie_id = tester.created_resources["movies"][0]
            tester.test_get_single_movie(movie_id)
            tester.test_fetch_metadata_without_api_key(movie_id)
        
        # Test scan functionality (updated for recursive scanning)
        print("\n🔍 Testing All Directory Scanning...")
        tester.test_scan_directories()
        
        # Test stats after adding data
        tester.test_stats_endpoint()
        
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