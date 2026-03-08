"""
License API Tests
Tests for the License Key System including:
- POST /api/license/validate - validates a license key
- POST /api/license/activate - activates a license on a machine
- POST /api/license/generate - generates a license key for Pro users (requires auth)
- GET /api/license/my-license - gets user's license (requires auth)
- POST /api/license/deactivate - deactivates license (requires auth)
- Invalid license key handling
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_MACHINE_ID = f"test-machine-{uuid.uuid4().hex[:8]}"
INVALID_LICENSE_KEY = "INVALID-XXXX-XXXX-XXXX-XXXX"
VALID_LICENSE_KEY_FORMAT = "OBSIDIAN-TEST-TEST-TEST-TEST"


class TestLicenseValidate:
    """Tests for POST /api/license/validate endpoint"""

    def test_validate_missing_data(self):
        """Test validation with missing license_key and machine_id"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": "",
            "machine_id": ""
        })
        # Should return 200 but with valid: False
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert data.get("error") == "missing_data"
        print(f"✓ Test validate_missing_data passed: {data}")

    def test_validate_invalid_license_key(self):
        """Test validation with invalid license key"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": INVALID_LICENSE_KEY,
            "machine_id": TEST_MACHINE_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert data.get("error") == "invalid_key"
        assert "not found" in data.get("message", "").lower() or "invalid" in data.get("message", "").lower()
        print(f"✓ Test validate_invalid_license_key passed: {data}")

    def test_validate_missing_machine_id(self):
        """Test validation with missing machine_id only"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": VALID_LICENSE_KEY_FORMAT,
            "machine_id": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Test validate_missing_machine_id passed: {data}")


class TestLicenseActivate:
    """Tests for POST /api/license/activate endpoint"""

    def test_activate_missing_data(self):
        """Test activation with missing license_key and machine_id"""
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": "",
            "machine_id": ""
        })
        # Should return 400 for missing required data
        assert response.status_code == 400
        data = response.json()
        assert "required" in data.get("detail", "").lower()
        print(f"✓ Test activate_missing_data passed: {data}")

    def test_activate_invalid_license_key(self):
        """Test activation with invalid license key"""
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": INVALID_LICENSE_KEY,
            "machine_id": TEST_MACHINE_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert data.get("error") == "invalid_key"
        assert "invalid" in data.get("message", "").lower()
        print(f"✓ Test activate_invalid_license_key passed: {data}")

    def test_activate_license_key_normalization(self):
        """Test that license key is normalized (uppercase)"""
        # Use lowercase license key - should still work (but fail since it's invalid)
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": "obsidian-test-test-test-test",
            "machine_id": TEST_MACHINE_ID
        })
        assert response.status_code == 200
        data = response.json()
        # Should fail with invalid_key (key doesn't exist), not a normalization error
        assert data["success"] == False
        assert data.get("error") == "invalid_key"
        print(f"✓ Test activate_license_key_normalization passed: {data}")


class TestLicenseGenerateRequiresAuth:
    """Tests for POST /api/license/generate endpoint (requires auth)"""

    def test_generate_without_auth(self):
        """Test license generation without authentication"""
        response = requests.post(f"{BASE_URL}/api/license/generate")
        # Should return 401 Unauthorized
        assert response.status_code == 401
        data = response.json()
        assert "authenticated" in data.get("detail", "").lower() or "unauthorized" in str(data).lower()
        print(f"✓ Test generate_without_auth passed: {data}")


class TestLicenseMyLicenseRequiresAuth:
    """Tests for GET /api/license/my-license endpoint (requires auth)"""

    def test_my_license_without_auth(self):
        """Test getting license without authentication"""
        response = requests.get(f"{BASE_URL}/api/license/my-license")
        # Should return 401 Unauthorized
        assert response.status_code == 401
        data = response.json()
        assert "authenticated" in data.get("detail", "").lower() or "unauthorized" in str(data).lower()
        print(f"✓ Test my_license_without_auth passed: {data}")


class TestLicenseDeactivateRequiresAuth:
    """Tests for POST /api/license/deactivate endpoint (requires auth)"""

    def test_deactivate_without_auth(self):
        """Test license deactivation without authentication"""
        response = requests.post(f"{BASE_URL}/api/license/deactivate")
        # Should return 401 Unauthorized
        assert response.status_code == 401
        data = response.json()
        assert "authenticated" in data.get("detail", "").lower() or "unauthorized" in str(data).lower()
        print(f"✓ Test deactivate_without_auth passed: {data}")


class TestLicenseAPIResponseFormat:
    """Tests for API response format consistency"""

    def test_validate_response_format(self):
        """Test that validate endpoint returns proper response format"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": "TEST-KEY",
            "machine_id": "test-machine"
        })
        assert response.status_code == 200
        data = response.json()
        # Should always have 'valid' field
        assert "valid" in data
        assert isinstance(data["valid"], bool)
        print(f"✓ Test validate_response_format passed: {data}")

    def test_activate_response_format(self):
        """Test that activate endpoint returns proper response format"""
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": "TEST-KEY",
            "machine_id": "test-machine"
        })
        assert response.status_code == 200
        data = response.json()
        # Should have 'success' field for non-error cases
        assert "success" in data
        assert isinstance(data["success"], bool)
        # Should have 'error' and 'message' when success is False
        if not data["success"]:
            assert "error" in data
            assert "message" in data
        print(f"✓ Test activate_response_format passed: {data}")


class TestLicenseKeyFormatValidation:
    """Tests for license key format handling"""

    def test_short_license_key(self):
        """Test with a very short license key"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": "SHORT",
            "machine_id": TEST_MACHINE_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Test short_license_key passed: {data}")

    def test_special_characters_in_license_key(self):
        """Test with special characters in license key"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": "OBSIDIAN-!@#$-TEST-TEST-TEST",
            "machine_id": TEST_MACHINE_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        print(f"✓ Test special_characters_in_license_key passed: {data}")

    def test_whitespace_handling(self):
        """Test that whitespace is properly stripped from license key"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": "  OBSIDIAN-TEST-TEST-TEST-TEST  ",
            "machine_id": "  test-machine  "
        })
        assert response.status_code == 200
        data = response.json()
        # Should properly strip whitespace and process (but still fail since key doesn't exist)
        assert data["valid"] == False
        assert data.get("error") == "invalid_key"
        print(f"✓ Test whitespace_handling passed: {data}")


class TestLicenseFullWorkflow:
    """End-to-end tests for license workflow with real test data"""

    # Test license key created by setup
    TEST_LICENSE_KEY = "OBSIDIAN-TEST-MMH6-TEST-TEST"
    PRO_SESSION_TOKEN = "test_session_1772940242949"
    FREE_SESSION_TOKEN = "test_free_session_1772940303591"

    def test_generate_license_for_pro_user(self):
        """Test that Pro users can generate/retrieve license keys"""
        response = requests.post(
            f"{BASE_URL}/api/license/generate",
            headers={"Authorization": f"Bearer {self.PRO_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "license_key" in data
        assert data["license_key"].startswith("OBSIDIAN-")
        assert "email" in data
        print(f"✓ Test generate_license_for_pro_user passed: {data}")

    def test_generate_license_fails_for_free_user(self):
        """Test that Free users cannot generate license keys"""
        response = requests.post(
            f"{BASE_URL}/api/license/generate",
            headers={"Authorization": f"Bearer {self.FREE_SESSION_TOKEN}"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "pro" in data.get("detail", "").lower()
        print(f"✓ Test generate_license_fails_for_free_user passed: {data}")

    def test_my_license_returns_license_for_pro_user(self):
        """Test that Pro users can retrieve their license"""
        response = requests.get(
            f"{BASE_URL}/api/license/my-license",
            headers={"Authorization": f"Bearer {self.PRO_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("has_license") == True
        assert "license_key" in data
        assert "email" in data
        print(f"✓ Test my_license_returns_license_for_pro_user passed: {data}")

    def test_validate_with_valid_license(self):
        """Test validation with a valid license key"""
        response = requests.post(f"{BASE_URL}/api/license/validate", json={
            "license_key": self.TEST_LICENSE_KEY,
            "machine_id": "integration-test-machine"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data.get("subscription_tier") == "pro"
        print(f"✓ Test validate_with_valid_license passed: {data}")

    def test_activate_with_valid_license(self):
        """Test activation with a valid license key"""
        unique_machine = f"test-machine-{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/license/activate", json={
            "license_key": self.TEST_LICENSE_KEY,
            "machine_id": unique_machine
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "activated" in data.get("message", "").lower()
        assert data.get("subscription_tier") == "pro"
        print(f"✓ Test activate_with_valid_license passed: {data}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
