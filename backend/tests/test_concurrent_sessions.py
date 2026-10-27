# Concurrent session preservation (iteration 19): prune only expired sessions on login
import os
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN_USER = "user_c709f5461327"


@pytest.fixture(scope="module")
def db():
    from dotenv import dotenv_values
    env = dotenv_values("/app/backend/.env")
    c = MongoClient(env["MONGO_URL"])
    yield c[env["DB_NAME"]]
    c.close()


def _me(token):
    return requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=20)


# Code review: the prune query must filter on expires_at, not delete all of user's sessions
def test_code_prunes_only_expired():
    src = open("/app/backend/server.py").read()
    assert 'delete_many({"user_id": user_id})' not in src
    assert 'delete_many({"user_id": user_id, "$or": [{"expires_at": {"$lt"' in src


# DB simulation: two unexpired + one expired; apply same prune query; both unexpired survive
def test_prune_keeps_unexpired_sessions(db):
    now = datetime.now(timezone.utc)
    t1, t2, t3, t_new = (f"TEST_sess_{uuid.uuid4().hex}" for _ in range(4))
    docs = [
        {"user_id": ADMIN_USER, "session_token": t1, "expires_at": (now + timedelta(days=5)).isoformat(), "created_at": now.isoformat()},
        {"user_id": ADMIN_USER, "session_token": t2, "expires_at": (now + timedelta(days=6)).isoformat(), "created_at": now.isoformat()},
        {"user_id": ADMIN_USER, "session_token": t3, "expires_at": (now - timedelta(days=1)).isoformat(), "created_at": now.isoformat()},
    ]
    db.user_sessions.insert_many(docs)
    try:
        assert _me(t1).status_code == 200
        assert _me(t3).status_code == 401
        # same logic as POST /api/auth/session
        db.user_sessions.delete_many({"user_id": ADMIN_USER, "expires_at": {"$lt": datetime.now(timezone.utc).isoformat()}})
        db.user_sessions.insert_one({"user_id": ADMIN_USER, "session_token": t_new,
                                     "expires_at": (now + timedelta(days=7)).isoformat(), "created_at": now.isoformat()})
        assert db.user_sessions.find_one({"session_token": t3}) is None
        for t in (t1, t2, t_new):
            r = _me(t)
            assert r.status_code == 200, t
            assert r.json()["email"] == "billrules@gmail.com"
        # main test token still alive
        assert _me("test_admin_session_token").status_code == 200
    finally:
        db.user_sessions.delete_many({"session_token": {"$in": [t1, t2, t3, t_new]}})
