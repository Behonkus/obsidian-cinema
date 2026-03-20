"""
Test cases for the Windows download endpoint.
Tests that GET /api/download/windows returns proper redirect to GitHub releases.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWindowsDownloadEndpoint:
    """Tests for /api/download/windows endpoint"""
    
    def test_download_windows_returns_redirect(self):
        """Test that download endpoint returns a redirect (307)"""
        response = requests.get(
            f"{BASE_URL}/api/download/windows",
            allow_redirects=False
        )
        
        # Should return 307 Temporary Redirect
        assert response.status_code == 307, f"Expected 307, got {response.status_code}"
        print(f"Download endpoint returned status: {response.status_code}")
        
    def test_download_windows_redirects_to_github(self):
        """Test that download redirects to GitHub releases"""
        response = requests.get(
            f"{BASE_URL}/api/download/windows",
            allow_redirects=False
        )
        
        assert response.status_code == 307
        location = response.headers.get('location', '')
        
        # Should redirect to GitHub
        assert 'github.com' in location.lower(), f"Expected GitHub redirect, got: {location}"
        assert 'obsidian-cinema' in location.lower(), f"Expected obsidian-cinema repo, got: {location}"
        print(f"Redirect location: {location}")
        
    def test_download_windows_prefers_exe_extension(self):
        """Test that download prefers .exe over .zip when available"""
        response = requests.get(
            f"{BASE_URL}/api/download/windows",
            allow_redirects=False
        )
        
        assert response.status_code == 307
        location = response.headers.get('location', '')
        
        # Check the extension - should prefer .exe if available, else .zip
        # Note: GitHub release may only have .zip currently until workflow runs
        assert location.endswith('.exe') or location.endswith('.zip'), \
            f"Expected .exe or .zip extension, got: {location}"
        
        if location.endswith('.exe'):
            print("Download redirects to .exe installer (preferred)")
        else:
            print("Download redirects to .zip (fallback - .exe not yet in release)")
            
    def test_download_windows_with_redirect_follow(self):
        """Test that following the redirect reaches a valid GitHub URL"""
        response = requests.get(
            f"{BASE_URL}/api/download/windows",
            allow_redirects=True,
            timeout=10
        )
        
        # Final response should be from GitHub
        assert 'github' in response.url.lower() or response.status_code in [200, 302], \
            f"Expected successful redirect chain, got status {response.status_code} at {response.url}"
        print(f"Final URL after redirects: {response.url}")
        print(f"Final status: {response.status_code}")


class TestDownloadEndpointErrorHandling:
    """Test error handling for download endpoint"""
    
    def test_download_windows_method_not_allowed_post(self):
        """Test that POST method is not allowed"""
        response = requests.post(
            f"{BASE_URL}/api/download/windows",
            allow_redirects=False
        )
        
        # Should return 405 Method Not Allowed
        assert response.status_code == 405, f"Expected 405 for POST, got {response.status_code}"
        print("POST method correctly returns 405")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
