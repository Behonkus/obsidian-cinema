# Admin licenses (revoke/reactivate/delete/gift) and usage enrichment tests
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TOKEN = "test_admin_session_token"
PROTECTED = {"OBSIDIAN-D9FE-BC22-4AE3-ACAA", "OBSIDIAN-1CBB-CC18-A8D1-3166"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    return s


def _get_lic(client, key):
    r = client.get(f"{BASE_URL}/api/admin/licenses")
    assert r.status_code == 200
    return next((l for l in r.json()["licenses"] if l["license_key"] == key), None)


# Auth gate
def test_admin_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/licenses")
    assert r.status_code in (401, 403)
    r = requests.get(f"{BASE_URL}/api/admin/usage")
    assert r.status_code in (401, 403)


# Gift -> revoke -> reactivate -> delete lifecycle
def test_gift_revoke_reactivate_delete(client):
    r = client.post(f"{BASE_URL}/api/admin/licenses/gift", json={"email": "TEST_gift@example.com", "note": "TEST"})
    assert r.status_code == 200
    key = r.json()["license_key"]
    assert key not in PROTECTED
    lic = _get_lic(client, key)
    assert lic and lic["gift"] is True and lic["is_active"] is True and lic["email"] == "TEST_gift@example.com"

    r = client.post(f"{BASE_URL}/api/admin/licenses/revoke", json={"license_key": key})
    assert r.status_code == 200 and r.json()["success"]
    assert _get_lic(client, key)["is_active"] is False

    r = client.post(f"{BASE_URL}/api/admin/licenses/reactivate", json={"license_key": key})
    assert r.status_code == 200
    assert _get_lic(client, key)["is_active"] is True

    r = client.post(f"{BASE_URL}/api/admin/licenses/delete", json={"license_key": key})
    assert r.status_code == 200
    assert _get_lic(client, key) is None

    r = client.post(f"{BASE_URL}/api/admin/licenses/delete", json={"license_key": key})
    assert r.status_code == 404


# Error handling
def test_missing_and_unknown_key(client):
    for ep in ("revoke", "reactivate", "delete"):
        assert client.post(f"{BASE_URL}/api/admin/licenses/{ep}", json={}).status_code == 400
        assert client.post(f"{BASE_URL}/api/admin/licenses/{ep}", json={"license_key": "TEST-NOPE-XXXX"}).status_code == 404


# Usage enrichment with email/name
def test_usage_has_email_name(client):
    r = client.get(f"{BASE_URL}/api/admin/usage")
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    recs = data["records"]
    assert len(recs) > 0
    for rec in recs:
        assert "email" in rec and "name" in rec
        assert "_id" not in rec
    m = next((x for x in recs if x.get("machine_id") == "test-machine-abc"), None)
    assert m is not None, "test-machine-abc usage record missing"
    assert m["email"] == "tester@example.com"
