# Changelog endpoint (v1.7.0 update pop-up / What's New) regression tests
import os
import re
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')


class TestChangelog:
    def test_changelog_shape(self):
        r = requests.get(f"{BASE_URL}/api/changelog", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data.get("releases"), list) and data["releases"]
        rel = data["releases"][0]
        assert rel["version"] == "1.7.0"
        assert "date" in rel
        assert isinstance(rel["highlights"], list) and len(rel["highlights"]) == 10
        assert all(isinstance(h, str) and h for h in rel["highlights"])
        assert "_id" not in rel

    def test_versions_match_package_json(self):
        import json
        pkg = json.load(open('/app/frontend/package.json'))
        assert pkg["version"] == "1.7.0"
        r = requests.get(f"{BASE_URL}/api/changelog", timeout=15)
        assert any(x["version"] == pkg["version"] for x in r.json()["releases"])

    def test_no_old_version_refs(self):
        hits = []
        for root in ['/app/frontend/src']:
            for dp, _, fs in os.walk(root):
                for fn in fs:
                    p = os.path.join(dp, fn)
                    try:
                        if '1.6.9' in open(p, errors='ignore').read():
                            hits.append(p)
                    except Exception:
                        pass
        for p in ['/app/frontend/package.json', '/app/marketing_materials.md']:
            if os.path.exists(p) and '1.6.9' in open(p).read():
                hits.append(p)
        assert hits == []
