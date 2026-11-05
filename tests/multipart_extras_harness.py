# Harness for multi-part Extras + auto multi-part check tests: TMDB mock with movie + TV search/details/season
import json
import asyncio
import re
from urllib.parse import urlparse, parse_qs

TV = "D:\\TV\\Batman (1966)\\"


def card(i, rel, title=None, **kw):
    path = TV + rel
    name = rel.split("\\")[-1]
    d = {"id": i, "title": title or name.rsplit(".", 1)[0], "file_name": name, "file_path": path, "added_at": 1}
    d.update(kw)
    return d


def scan_item(m):
    return {"id": m["id"], "file_path": m["file_path"], "file_name": m["file_name"], "title": m["title"], "year": m.get("year")}


class TmdbMock:
    """movie search -> one hit per query; tv search -> Batman id 5; season N -> 3 episodes."""
    def __init__(self, delay=0.2, movie_hits=True):
        self.delay = delay
        self.movie_hits = movie_hits
        self.calls = []

    async def handle(self, route):
        url = route.request.url
        p = urlparse(url)
        qs = parse_qs(p.query)
        hdr = {"Access-Control-Allow-Origin": "*"}
        self.calls.append(p.path + ("?query=" + qs["query"][0] if "query" in qs else ""))
        await asyncio.sleep(self.delay)
        body = {"results": []}
        path = p.path
        if path.endswith("/search/movie"):
            q = qs.get("query", [""])[0]
            if self.movie_hits:
                tid = 7000 + (sum(map(ord, q)) % 900)
                body = {"results": [{"id": tid, "title": q, "original_title": q, "release_date": "2000-01-01",
                                     "popularity": 50, "vote_count": 5000, "poster_path": f"/m{tid}.jpg", "overview": "movie ov"}]}
        elif path.endswith("/search/tv"):
            q = qs.get("query", [""])[0]
            if "batman" in q.lower():
                body = {"results": [{"id": 5, "name": "Batman", "original_name": "Batman", "first_air_date": "1966-01-12",
                                     "popularity": 50, "vote_count": 500, "poster_path": "/bat.jpg"}]}
        else:
            m = re.search(r"/3/tv/(\d+)/season/(\d+)$", path)
            if m:
                s = int(m.group(2))
                body = {"episodes": [{"episode_number": e, "name": f"S{s}E{e} Name", "overview": "ep", "runtime": 25,
                                      "still_path": None, "air_date": "1966-01-01"} for e in range(1, 4)]}
            else:
                m = re.search(r"/3/(movie|tv)/(\d+)$", path)
                if m:
                    tid = int(m.group(2))
                    body = {"id": tid, "title": "Batman", "name": "Batman", "poster_path": f"/p{tid}.jpg", "runtime": 25,
                            "overview": "o", "vote_average": 7.5, "vote_count": 500, "release_date": "1966-01-01",
                            "first_air_date": "1966-01-12", "genres": [], "number_of_episodes": 120, "episode_run_time": [25],
                            "credits": {"cast": [], "crew": []}, "aggregate_credits": {"cast": [], "crew": []},
                            "release_dates": {"results": []}, "content_ratings": {"results": []}, "external_ids": {}, "created_by": []}
        await route.fulfill(status=200, content_type="application/json", body=json.dumps(body), headers=hdr)
