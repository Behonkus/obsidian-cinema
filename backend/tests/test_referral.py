"""
Test suite for Referral Program feature
- Tests referral code validation
- Tests pricing endpoint with referral discount info
- Tests checkout session with referral code discount
- Tests Pro user referral code display
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
FREE_USER_TOKEN = "test_session_persistent_1770921307628"
PRO_USER_TOKEN = "test_session_pro_1770922222961"
VALID_REFERRAL_CODE = "CINEMA-TEST01"


class TestPricingEndpoint:
    """Test /api/pricing endpoint for referral discount info"""
    
    def test_pricing_returns_referral_discount_info(self):
        """GET /api/pricing returns referral discount info ($5 discount)"""
        response = requests.get(f"{BASE_URL}/api/pricing")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check pro_tier pricing
        assert "pro_tier" in data
        assert data["pro_tier"]["price"] == 29.99
        assert data["pro_tier"]["discounted_price"] == 24.99
        assert data["pro_tier"]["discount_amount"] == 5.0
        assert data["pro_tier"]["currency"] == "usd"
        
        # Check referral info
        assert "referral" in data
        assert data["referral"]["discount"] == 5.0
        assert "description" in data["referral"]


class TestReferralValidation:
    """Test /api/referral/validate/{code} endpoint"""
    
    def test_invalid_referral_code_returns_valid_false(self):
        """GET /api/referral/validate/{code} returns valid=false for invalid codes"""
        response = requests.get(f"{BASE_URL}/api/referral/validate/INVALID-CODE-123")
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == False
        assert "message" in data
        assert data["message"] == "Invalid referral code"
    
    def test_valid_referral_code_returns_discount_info(self):
        """GET /api/referral/validate/{code} returns valid=true with discount for valid Pro user codes"""
        response = requests.get(f"{BASE_URL}/api/referral/validate/{VALID_REFERRAL_CODE}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == VALID_REFERRAL_CODE
        assert data["discount"] == 5.0
        assert data["final_price"] == 24.99
        assert "referrer_name" in data
        assert "message" in data
    
    def test_referral_code_case_insensitive(self):
        """Referral code validation is case insensitive"""
        response = requests.get(f"{BASE_URL}/api/referral/validate/{VALID_REFERRAL_CODE.lower()}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"] == True
        assert data["code"] == VALID_REFERRAL_CODE  # Should be uppercase


class TestCheckoutWithReferral:
    """Test checkout session creation with referral code"""
    
    def test_checkout_with_valid_referral_applies_discount(self):
        """POST /api/stripe/create-checkout-session applies discount when valid referral code provided"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout-session",
            headers={"Authorization": f"Bearer {FREE_USER_TOKEN}"},
            json={
                "origin_url": BASE_URL,
                "referral_code": VALID_REFERRAL_CODE
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount"] == 24.99  # Discounted price
        assert data["discount_applied"] == True
        assert "url" in data
        assert "session_id" in data
    
    def test_checkout_without_referral_full_price(self):
        """POST /api/stripe/create-checkout-session without referral code uses full price"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout-session",
            headers={"Authorization": f"Bearer {FREE_USER_TOKEN}"},
            json={"origin_url": BASE_URL}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount"] == 29.99  # Full price
        assert data["discount_applied"] == False
    
    def test_checkout_with_invalid_referral_full_price(self):
        """POST /api/stripe/create-checkout-session with invalid referral code uses full price"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/create-checkout-session",
            headers={"Authorization": f"Bearer {FREE_USER_TOKEN}"},
            json={
                "origin_url": BASE_URL,
                "referral_code": "INVALID-CODE"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["amount"] == 29.99  # Full price (invalid code ignored)
        assert data["discount_applied"] == False


class TestProUserReferralCode:
    """Test Pro user referral code display"""
    
    def test_pro_user_has_referral_code_in_auth_me(self):
        """Pro users see their referral code in /api/auth/me response"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {PRO_USER_TOKEN}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["subscription_tier"] == "pro"
        assert "referral_code" in data
        assert data["referral_code"] == VALID_REFERRAL_CODE
        assert "referral_count" in data
        assert isinstance(data["referral_count"], int)
    
    def test_pro_user_has_referral_code_in_limits(self):
        """Pro users see their referral code in /api/user/limits response"""
        response = requests.get(
            f"{BASE_URL}/api/user/limits",
            headers={"Authorization": f"Bearer {PRO_USER_TOKEN}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["subscription_tier"] == "pro"
        assert "referral_code" in data
        assert data["referral_code"] == VALID_REFERRAL_CODE
        assert "referral_count" in data


class TestFreeUserNoReferralCode:
    """Test that free users don't have referral codes"""
    
    def test_free_user_no_referral_code(self):
        """Free users don't have referral codes"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {FREE_USER_TOKEN}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["subscription_tier"] == "free"
        # Free users should have null/None referral_code
        assert data.get("referral_code") is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
