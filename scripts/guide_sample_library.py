"""Builds a realistic sample library (real TMDB metadata) for User Guide screenshots."""
import json
import os
import re
import time
import urllib.request

KEY = re.search(r'TMDB_API_KEY="?([^"\n]+)', open("/app/backend/.env").read()).group(1)
IMG, PROF, BACK = "https://image.tmdb.org/t/p/w500", "https://image.tmdb.org/t/p/w185", "https://image.tmdb.org/t/p/w780"

MOVIES = [278, 238, 27205, 157336, 155, 680, 496243, 335984, 76341, 244786, 438631, 603, 348, 98, 329865, 872585, 1124, 545611]
ANIM = [129, 862, 14160, 324857, 508442, 4935]
DOCS = [515042, 682110, 80767, 549559]
TV = [(1396, "D:\\TV Shows\\Breaking Bad", 2), (66732, "D:\\TV Shows\\Stranger Things", 2), (94997, "D:\\TV Shows\\House of the Dragon", 1)]
DOC_TV = [(68595, "E:\\Documentaries\\Planet Earth II", 1)]


def get(path, **params):
    q = "&".join([f"api_key={KEY}"] + [f"{k}={v}" for k, v in params.items()])
    with urllib.request.urlopen(f"https://api.themoviedb.org/3{path}?{q}", timeout=20) as r:
        return json.loads(r.read())


def safe(t):
    return re.sub(r'[\\/:*?"<>|]', "", t)


def common(d, title, year, folder, fname, mtype):
    cast = [{"name": c["name"], "character": c.get("character"), "profile_path": PROF + c["profile_path"] if c.get("profile_path") else None}
            for c in (d.get("credits") or {}).get("cast", [])[:10]]
    return {
        "id": f"g{d['id']}", "title": title, "year": year, "file_name": fname, "file_path": f"{folder}\\{fname}",
        "directory_path": folder, "tmdb_id": d["id"], "media_type": mtype,
        "poster_path": IMG + d["poster_path"] if d.get("poster_path") else None,
        "backdrop_path": BACK + d["backdrop_path"] if d.get("backdrop_path") else None,
        "overview": d.get("overview"), "rating": round(d.get("vote_average") or 0, 1) or None, "vote_count": d.get("vote_count", 0),
        "genres": [g["name"] for g in d.get("genres", [])], "tagline": d.get("tagline") or None, "cast": cast,
        "studios": [c["name"] for c in (d.get("production_companies") or d.get("networks") or [])[:3]],
        "aka": [], "metadata_updated_at": int(time.time() * 1000), "added_at": int(time.time() * 1000),
    }


def movie(mid, folder):
    d = get(f"/movie/{mid}", append_to_response="credits")
    year = int(d["release_date"][:4])
    crew = [c for c in d["credits"]["crew"] if c.get("job") == "Director"]
    title = d["title"]
    m = common(d, title, year, folder, f"{safe(title)} ({year}).mkv", "movie")
    m.update(runtime=d.get("runtime"), director=", ".join(c["name"] for c in crew) or None,
             directors=[{"name": c["name"], "profile_path": PROF + c["profile_path"] if c.get("profile_path") else None} for c in crew],
             imdb_id=d.get("imdb_id"), release_date=d.get("release_date"))
    return m


def show(tid, folder, seasons):
    d = get(f"/tv/{tid}", append_to_response="credits")
    year = int(d["first_air_date"][:4])
    title = d["name"]
    parts = []
    for s in range(1, seasons + 1):
        sd = get(f"/tv/{tid}/season/{s}")
        for ep in sd.get("episodes", []):
            fn = f"{safe(title)} S{s:02d}E{ep['episode_number']:02d}.mkv"
            parts.append({"file_path": f"{folder}\\Season {s}\\{fn}", "file_name": fn})
    m = common(d, title, year, folder, parts[0]["file_name"], "tv")
    m.update(file_path=parts[0]["file_path"], parts=parts, director=", ".join(c["name"] for c in d.get("created_by", [])) or None,
             runtime=(d.get("episode_run_time") or [None])[0], season_count=d.get("number_of_seasons"),
             episode_count=d.get("number_of_episodes"), directors=[], release_date=d.get("first_air_date"))
    return m


def build():
    lib, cats = [], {"D:\\Movies": "movies", "D:\\TV Shows": "tv", "E:\\Documentaries": "docs", "E:\\Animation": "anim"}
    lib += [movie(i, "D:\\Movies") for i in MOVIES]
    lib += [movie(i, "E:\\Animation") for i in ANIM]
    lib += [movie(i, "E:\\Documentaries") for i in DOCS]
    lib += [show(t, f, s) for t, f, s in TV]
    lib += [show(t, f, s) for t, f, s in DOC_TV]
    now = int(time.time() * 1000)
    for i, m in enumerate(lib):
        m["added_at"] = now - i * 3600_000
    os.makedirs("/app/docs", exist_ok=True)
    json.dump({"lib": lib, "cats": cats}, open("/app/docs/guide_sample_library.json", "w"))
    print(len(lib), "titles")


if __name__ == "__main__":
    build()
