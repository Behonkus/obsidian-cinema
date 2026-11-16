# Iteration 46: performance pass regression - indexes, changelog 1.7.1, auth/session, license validate, usage ping, admin endpoints
import os
import pytest
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
load_dotenv('/app/backend/.env')
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN = {"Authorization": "Bearer test_admin_session_token"}


@pytest.fixture(scope="module")
def db():
    c = MongoClient(os.environ.get('MONGO_URL'))
    yield c[os.environ.get('DB_NAME')]
    c.close()


# Startup indexes
@pytest.mark.parametrize("coll,field", [
    ("users", "user_id"), ("users", "email"), ("user_sessions", "session_token"), ("user_sessions", "user_id"),
    ("license_keys", "user_id"), ("license_keys", "license_key"), ("usage_tracking", "machine_id"),
    ("payment_transactions", "session_id"), ("movies", "id"), ("movies", "file_path"),
    ("collections", "id"), ("directories", "id"),
])
def test_index_exists(db, coll, field):
    info = db[coll].index_information()
    keys = [v["key"] for v in info.values()]
    assert [(field, 1)] in keys, f"{coll}.{field} missing: {info}"
    # Non-unique
    for v in info.values():
        if v["key"] == [(field, 1)]:
            assert not v.get("unique", False)


# Changelog
def test_changelog_171_first():
    r = requests.get(f"{BASE_URL}/api/changelog", timeout=20)
    assert r.status_code == 200
    rel = r.json()["releases"]
    assert rel[0]["version"] == "1.7.1"
    assert len(rel[0]["highlights"]) == 14


# Auth / session
def test_auth_me_admin():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=ADMIN, timeout=20)
    assert r.status_code == 200
    assert r.json()["email"] == "billrules@gmail.com"


def test_auth_me_cookie():
    r = requests.get(f"{BASE_URL}/api/auth/me", cookies={"session_token": "test_admin_session_token"}, timeout=20)
    assert r.status_code == 200


def test_auth_me_unauth():
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
    assert r.status_code == 401


# License validate
def test_license_validate_invalid_key():
    r = requests.post(f"{BASE_URL}/api/license/validate", json={"license_key": "TEST-NOPE-9999", "machine_id": "TEST_m1"}, timeout=20)
    assert r.status_code == 200
    assert r.json()["valid"] is False


def test_license_validate_missing():
    r = requests.post(f"{BASE_URL}/api/license/validate", json={"license_key": " ", "machine_id": "x"}, timeout=20)
    assert r.status_code == 200
    assert r.json() == {"valid": False, "error": "missing_data"}


# Usage ping
def test_usage_ping_and_admin_usage(db):
    mid = "TEST_iter46_machine"
    try:
        r = requests.post(f"{BASE_URL}/api/usage/ping", json={"machine_id": mid, "version": "1.7.1", "movie_count": 7}, timeout=20)
        assert r.status_code == 200 and r.json().get("ok") is True
        doc = db.usage_tracking.find_one({"machine_id": mid})
        assert doc and doc["version"] == "1.7.1" and doc["movie_count"] == 7
        u = requests.get(f"{BASE_URL}/api/admin/usage", headers=ADMIN, timeout=20)
        assert u.status_code == 200
    finally:
        db.usage_tracking.delete_one({"machine_id": mid})


# Admin endpoints
@pytest.mark.parametrize("path", ["/api/admin/users", "/api/admin/licenses", "/api/admin/stats", "/api/admin/usage"])
def test_admin_get(path):
    r = requests.get(f"{BASE_URL}{path}", headers=ADMIN, timeout=20)
    assert r.status_code == 200, r.text
    assert isinstance(r.json(), (dict, list))


@pytest.mark.parametrize("path", ["/api/admin/users", "/api/admin/stats"])
def test_admin_requires_auth(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=20)
    assert r.status_code in (401, 403)
