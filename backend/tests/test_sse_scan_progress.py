"""
Tests for SSE Bulk Metadata Fetch and Scan Progress endpoints.
Features tested:
- GET /api/movies/fetch-all-metadata/stream - SSE progress events
- POST /api/scan/start - Start background scan with progress tracking
- GET /api/scan/progress/{scan_id} - Real-time scan progress
"""
import pytest
import requests
import os
import time
import json
import subprocess

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test session token from previous iteration
TEST_SESSION_TOKEN = "test_scan_session_1772018023207"

# Use shorter timeouts for tests
DEFAULT_TIMEOUT = 5


class TestSSEBulkMetadataFetch:
    """Tests for SSE-based bulk metadata fetch endpoint"""
    
    def test_sse_endpoint_returns_proper_format(self):
        """GET /api/movies/fetch-all-metadata/stream returns SSE format events"""
        # Use curl for SSE testing since requests has issues with streaming
        result = subprocess.run(
            ["curl", "-s", "-N", "--max-time", "5", f"{BASE_URL}/api/movies/fetch-all-metadata/stream"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        content = result.stdout
        
        # Verify SSE format (data: {...}\n\n)
        assert "data:" in content, "Response should contain SSE 'data:' prefix"
        assert "type" in content, "Response should contain 'type' field in JSON"
    
    def test_sse_returns_start_event(self):
        """SSE stream starts with 'start' type event"""
        result = subprocess.run(
            ["curl", "-s", "-N", "--max-time", "5", f"{BASE_URL}/api/movies/fetch-all-metadata/stream"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        content = result.stdout
        
        # Parse events
        events = []
        for line in content.split('\n'):
            if line.startswith("data:"):
                data_str = line[5:].strip()
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass
        
        # First event should be 'start' type
        assert len(events) > 0, "Should receive at least one event"
        assert events[0].get("type") == "start", f"First event should be 'start', got {events[0].get('type')}"
        assert "total" in events[0], "Start event should contain 'total' field"
        assert "message" in events[0], "Start event should contain 'message' field"
    
    def test_sse_returns_complete_event(self):
        """SSE stream ends with 'complete' type event"""
        result = subprocess.run(
            ["curl", "-s", "-N", "--max-time", "10", f"{BASE_URL}/api/movies/fetch-all-metadata/stream"],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        content = result.stdout
        
        # Parse events
        events = []
        for line in content.split('\n'):
            if line.startswith("data:"):
                data_str = line[5:].strip()
                try:
                    events.append(json.loads(data_str))
                except json.JSONDecodeError:
                    pass
        
        # Last event should be 'complete' type
        assert len(events) > 0, "Should receive at least one event"
        last_event = events[-1]
        assert last_event.get("type") == "complete", f"Last event should be 'complete', got {last_event.get('type')}"
        assert "updated" in last_event, "Complete event should contain 'updated' field"
        assert "total" in last_event, "Complete event should contain 'total' field"
        assert "message" in last_event, "Complete event should contain 'message' field"


class TestScanStartEndpoint:
    """Tests for POST /api/scan/start endpoint"""
    
    def test_scan_start_returns_scan_id(self):
        """POST /api/scan/start returns scan_id and status"""
        response = requests.post(
            f"{BASE_URL}/api/scan/start?recursive=true",
            cookies={"session_token": TEST_SESSION_TOKEN},
            headers={"Content-Type": "application/json"},
            timeout=DEFAULT_TIMEOUT
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "scan_id" in data, "Response should contain 'scan_id'"
        assert "status" in data, "Response should contain 'status'"
        assert data["status"] == "started", f"Status should be 'started', got {data['status']}"
        assert data["scan_id"].startswith("scan_"), f"scan_id should start with 'scan_', got {data['scan_id']}"
    
    def test_scan_start_without_auth_returns_401(self):
        """POST /api/scan/start without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/scan/start?recursive=true",
            headers={"Content-Type": "application/json"},
            timeout=DEFAULT_TIMEOUT
        )
        
        # Should return 401 for unauthenticated request
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestScanProgressEndpoint:
    """Tests for GET /api/scan/progress/{scan_id} endpoint"""
    
    def test_scan_progress_returns_progress_data(self):
        """GET /api/scan/progress/{scan_id} returns progress data"""
        # First start a scan
        start_response = requests.post(
            f"{BASE_URL}/api/scan/start?recursive=true",
            cookies={"session_token": TEST_SESSION_TOKEN},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert start_response.status_code == 200
        scan_id = start_response.json()["scan_id"]
        
        # Wait a bit for scan to progress
        time.sleep(0.5)
        
        # Get progress
        progress_response = requests.get(
            f"{BASE_URL}/api/scan/progress/{scan_id}",
            timeout=10
        )
        
        # Status code assertion
        assert progress_response.status_code == 200, f"Expected 200, got {progress_response.status_code}"
        
        # Data assertions
        data = progress_response.json()
        assert "status" in data, "Response should contain 'status'"
        assert "directories_total" in data, "Response should contain 'directories_total'"
        assert "directories_scanned" in data, "Response should contain 'directories_scanned'"
        assert "files_found" in data, "Response should contain 'files_found'"
        assert "movies_added" in data, "Response should contain 'movies_added'"
    
    def test_scan_progress_completes(self):
        """Scan progress eventually shows status 'complete'"""
        # Start a scan
        start_response = requests.post(
            f"{BASE_URL}/api/scan/start?recursive=true",
            cookies={"session_token": TEST_SESSION_TOKEN},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert start_response.status_code == 200
        scan_id = start_response.json()["scan_id"]
        
        # Poll for completion (max 10 seconds)
        max_attempts = 20
        completed = False
        final_data = None
        
        for _ in range(max_attempts):
            progress_response = requests.get(
                f"{BASE_URL}/api/scan/progress/{scan_id}",
                timeout=10
            )
            
            if progress_response.status_code == 200:
                data = progress_response.json()
                if data.get("status") == "complete":
                    completed = True
                    final_data = data
                    break
            
            time.sleep(0.5)
        
        assert completed, "Scan should complete within 10 seconds"
        assert final_data is not None, "Should have final progress data"
        assert final_data["status"] == "complete", f"Final status should be 'complete', got {final_data['status']}"
        assert "directories_total" in final_data, "Complete response should have directories_total"
        assert "directories_scanned" in final_data, "Complete response should have directories_scanned"
        assert final_data["directories_scanned"] == final_data["directories_total"], \
            "All directories should be scanned when complete"
    
    def test_scan_progress_invalid_id_returns_not_found(self):
        """GET /api/scan/progress/{invalid_id} returns not_found status"""
        response = requests.get(
            f"{BASE_URL}/api/scan/progress/invalid_scan_id_12345",
            timeout=10
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertion
        data = response.json()
        assert data.get("status") == "not_found", f"Status should be 'not_found', got {data.get('status')}"


class TestScanProgressFields:
    """Tests for scan progress response fields"""
    
    def test_scan_progress_has_all_required_fields(self):
        """Scan progress response contains all required fields"""
        # Start a scan
        start_response = requests.post(
            f"{BASE_URL}/api/scan/start?recursive=true",
            cookies={"session_token": TEST_SESSION_TOKEN},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert start_response.status_code == 200
        scan_id = start_response.json()["scan_id"]
        
        # Wait for completion
        time.sleep(1)
        
        # Get progress
        progress_response = requests.get(
            f"{BASE_URL}/api/scan/progress/{scan_id}",
            timeout=10
        )
        
        assert progress_response.status_code == 200
        data = progress_response.json()
        
        # Required fields
        required_fields = [
            "status",
            "scan_id",
            "directories_total",
            "directories_scanned",
            "files_found",
            "movies_added",
            "skipped_due_to_limit"
        ]
        
        for field in required_fields:
            assert field in data, f"Response should contain '{field}' field"
        
        # Type assertions
        assert isinstance(data["directories_total"], int), "directories_total should be int"
        assert isinstance(data["directories_scanned"], int), "directories_scanned should be int"
        assert isinstance(data["files_found"], int), "files_found should be int"
        assert isinstance(data["movies_added"], int), "movies_added should be int"
        assert isinstance(data["skipped_due_to_limit"], int), "skipped_due_to_limit should be int"


class TestStatsEndpoint:
    """Tests for stats endpoint to verify without_metadata count"""
    
    def test_stats_returns_without_metadata_count(self):
        """GET /api/stats returns without_metadata count"""
        response = requests.get(
            f"{BASE_URL}/api/stats",
            timeout=10
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "without_metadata" in data, "Stats should contain 'without_metadata' field"
        assert isinstance(data["without_metadata"], int), "without_metadata should be int"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
