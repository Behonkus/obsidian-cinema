"""Fictional sample library (original posters, invented titles and people) for guide + landing screenshots."""
import json
import time

U = "https://static.prod-images.emergentagent.com/jobs/2ff8f579-4e90-4c18-854e-f3fd4c43af64/images/"
P = {
    "orbit": "f4a350b46e67f855a324246214a7c9e3bccd77480914f0d79786a29e2daf7d77", "lighthouse": "0591e38174d73d4c7cd85d336af1fafb0bc1fb5065f90ec08ad07ceef71be3ba",
    "pines": "3d0a4b4c7500aefa0c987bc3e6526590ea133edc4110f7a3a4fdec7add668d2b", "redline": "4e19f59c32370fa29acc1e8cf5a480e42c08d420b322f41672eefafccde0ab51",
    "dust": "81b06f9c84d898f4f8e5568fdd031322ab3ccf81a9dd83747d34be79c0727616", "static": "95c68159dab1b11b5a407d39c2145452c8cd8b6db71344919bab0fe1b091acb2",
    "iron": "92594bb4bbf1200986d83508a6c94a88f2639b37f3b47d2a391f1db27e647202", "crowns": "3243d0e66654d42bcbe552dfb05abe62893d1f3e570515e7b202da5d3a88736a",
    "salt": "f69191f204fcb06ceba4abcb6c47bc4537e28c8f5e02c2589c4a795ee0977c60", "neon": "f1f4f8a4e8af3726dc74b73291b60d60eafa9bb7c6085c4d0adce113fb82911a",
    "throne": "1ef9e90c45e4513626ec49a19e431b135a71edc89b2c7d23a6136027406d6898", "wild": "9abd24298d9bcd15cb1f6a0bcc4d2ef89a8dfc264e254f6db92660d33c4be74b",
    "clouds": "f19beb26fb39ecf93228259ed632b71d19f5868d91fa3a6cf9dafb2a2ac4b7e0", "pip": "5ba6bb06df8525c79e98429be4fbed24469ea4582908ab00452a4487cc245147",
    "vault": "c7c10f0dd41c6e5572ec04698c0e0e896cd6086673cbae0960f0202cdf912011", "whale": "919278cac960d68762103ca8fe80020bad156b9bfc1e7fe11bb73082bc83f723",
    "harbor": "a6de78d32701660d0ba24571c0cc42032f9764c1ea8646d769eaed16a97432ba", "robo": "30d85466a597415510b278782de94bda9b5fffa36ccbe2d6791ec80fceda9bff",
    "deep": "ca3df6629c2f0dfa1bfbea6aa1f6655d2327d295d614e966ee6db476d059019b", "signal": "139f8764b42de22ee34ad18a923058c8089f4796ec33d0e98ec6bdc2bde57a0f",
}
CAST = [("Mara Ellison", "Ava"), ("Theo Vance", "Kade"), ("Priya Sol", "Dr. Ren"), ("Jonah Wilde", "Marlow"), ("Lena Okafor", "Iris"),
        ("Rafael Ortega", "Cole"), ("Hana Mori", "Yumi"), ("Callum Reyes", "Silas")]

# id, poster, title, year, folder, type, genres, rating, runtime, director, overview, tagline
ITEMS = [
    ("g27205", "neon", "Neon Drift", 2023, "D:\\Movies", "movie", ["Science Fiction", "Thriller"], 8.4, 128, "Nadia Kerr",
     "In a rain-soaked megacity, a courier who smuggles memories takes one last job — and discovers the package is her own past.", "Every memory has a price."),
    ("gm2", "lighthouse", "The Last Lighthouse", 2021, "D:\\Movies", "movie", ["Drama"], 8.1, 117, "Owen Brandt",
     "A retired keeper refuses to leave his storm-battered lighthouse as the sea claims the coast around it.", None),
    ("gm3", "iron", "Iron Meridian", 2019, "D:\\Movies", "movie", ["War", "Drama"], 7.9, 142, "Ilse Varga",
     "A signal corps unit races across a burning front line to deliver an order that could end the war.", None),
    ("gm4", "orbit", "Orbit Nine", 2024, "D:\\Movies", "movie", ["Science Fiction", "Adventure"], 8.3, 136, "Nadia Kerr",
     "The last crew of a failing space station must choose between rescue and the discovery of a lifetime.", None),
    ("gm5", "redline", "Redline Protocol", 2022, "D:\\Movies", "movie", ["Action", "Thriller"], 7.4, 109, "Marcus Dane",
     "An ex-getaway driver has one night to cross the desert with a witness everyone wants dead.", None),
    ("gm6", "pines", "Hollow Pines", 2020, "D:\\Movies", "movie", ["Horror", "Mystery"], 7.1, 98, "Sofie Lund",
     "Five friends rent a cabin deep in the pines and find the woods remember every guest.", None),
    ("gm7", "vault", "The Vault Game", 2023, "D:\\Movies", "movie", ["Crime", "Thriller"], 7.8, 121, "Marcus Dane",
     "A crew of retired thieves reunite to rob the one bank they swore they never would.", None),
    ("gm8", "crowns", "Paper Crowns", 2018, "D:\\Movies", "movie", ["Drama", "History"], 7.6, 131, "Ilse Varga",
     "A forger in a crumbling royal court rewrites history one decree at a time.", None),
    ("gm9", "salt", "Saltwater Summer", 2021, "D:\\Movies", "movie", ["Romance", "Drama"], 7.2, 104, "Owen Brandt",
     "Two strangers stranded in a seaside town during a heatwave fall for each other — and the town.", None),
    ("gm10", "static", "Static", 2017, "D:\\Movies", "movie", ["Mystery", "Thriller"], 7.5, 112, "Sofie Lund",
     "A night-shift radio operator picks up a broadcast that predicts tomorrow's news.", None),
    ("gm11", "dust", "Kingdom of Dust", 2016, "D:\\Movies", "movie", ["Western", "Drama"], 7.7, 126, "Elias Crane",
     "A drifter rides into a dying frontier town and is mistaken for the sheriff they have been waiting for.", None),
    ("g129", "whale", "Skywhale", 2020, "E:\\Animation", "movie", ["Animation", "Fantasy"], 8.6, 101, "Aiko Tanabe",
     "A girl on a floating island befriends a whale that swims through the clouds.", None),
    ("ga2", "pip", "Pip and the Paper Kite", 2022, "E:\\Animation", "movie", ["Animation", "Family"], 7.9, 92, "Leo Marsh",
     "A curious fox cub builds a kite big enough to carry the whole village to the sky.", None),
    ("ga3", "robo", "Robo & Rusty", 2024, "E:\\Animation", "movie", ["Animation", "Comedy"], 8.0, 95, "Leo Marsh",
     "A tiny repair robot and a scruffy junkyard dog set off to find where lost things go.", None),
    ("gd1", "deep", "Deep Blue Kingdom", 2019, "E:\\Documentaries", "movie", ["Documentary"], 8.2, 88, "Ruth Calder",
     "A year beneath the waves of the world's largest coral reef.", None),
    ("gd2", "clouds", "Above the Clouds", 2021, "E:\\Documentaries", "movie", ["Documentary", "Adventure"], 8.0, 97, "Tom Asher",
     "A climber attempts the unclimbed north ridge of a Himalayan giant.", None),
]
SHOWS = [
    ("g1396", "harbor", "Cold Harbor", 2019, "D:\\TV Shows\\Cold Harbor", 2, 8, ["Crime", "Drama"], 8.7, "Grace Holloway",
     "A detective returns to the fishing town she fled to solve the disappearance that has haunted it for twenty years."),
    ("gt2", "signal", "The Signal", 2021, "D:\\TV Shows\\The Signal", 2, 8, ["Science Fiction", "Mystery"], 8.4, "Ben & Kit Arlo",
     "In a small town in 1986, four kids decode a signal from the sky — and something answers."),
    ("gt3", "throne", "Throne of Ash", 2023, "D:\\TV Shows\\Throne of Ash", 1, 9, ["Fantasy", "Drama"], 8.2, "Miriam Stokes",
     "Rival houses fight for a throne carved from the bones of the last dragon."),
    ("gt4", "wild", "Wild Earth", 2022, "E:\\Documentaries\\Wild Earth", 1, 6, ["Documentary"], 9.0, "Ruth Calder",
     "Six episodes across the planet's most extreme wild places."),
]


def cast(seed):
    rot = CAST[seed % len(CAST):] + CAST[:seed % len(CAST)]
    return [{"name": n, "character": c, "profile_path": None} for n, c in rot[:6]]


def build():
    now = int(time.time() * 1000)
    lib = []
    for i, (mid, pk, title, year, folder, mt, genres, rating, rt, director, ov, tag) in enumerate(ITEMS):
        fn = f"{title} ({year}).mkv"
        lib.append({"id": mid, "title": title, "year": year, "file_name": fn, "file_path": f"{folder}\\{fn}", "directory_path": folder,
                    "tmdb_id": 900000 + i, "media_type": mt, "poster_path": U + P[pk] + ".jpeg", "overview": ov, "rating": rating,
                    "vote_count": 1200 + i * 37, "genres": genres, "runtime": rt, "director": director,
                    "directors": [{"name": director, "profile_path": None}], "tagline": tag, "cast": cast(i), "aka": [],
                    "metadata_updated_at": now, "added_at": now - i * 3600_000, "release_date": f"{year}-05-01"})
    for j, (mid, pk, title, year, folder, seasons, eps, genres, rating, creator, ov) in enumerate(SHOWS):
        parts = []
        for s in range(1, seasons + 1):
            for e in range(1, eps + 1):
                fn = f"{title} S{s:02d}E{e:02d}.mkv"
                parts.append({"file_path": f"{folder}\\Season {s}\\{fn}", "file_name": fn})
        lib.append({"id": mid, "title": title, "year": year, "file_name": parts[0]["file_name"], "file_path": parts[0]["file_path"],
                    "directory_path": folder, "tmdb_id": 910000 + j, "media_type": "tv", "poster_path": U + P[pk] + ".jpeg",
                    "overview": ov, "rating": rating, "vote_count": 3000 + j * 51, "genres": genres, "runtime": 52, "director": creator,
                    "directors": [], "season_count": seasons, "episode_count": len(parts), "parts": parts, "cast": cast(j + 3), "aka": [],
                    "metadata_updated_at": now, "added_at": now - (j * 4 + 1) * 3600_000 - 1800_000, "release_date": f"{year}-09-01"})
    lib.sort(key=lambda m: -m["added_at"])
    cats = {"D:\\Movies": "movies", "D:\\TV Shows": "tv", "E:\\Documentaries": "docs", "E:\\Animation": "anim"}
    json.dump({"lib": lib, "cats": cats}, open("/app/docs/guide_sample_library.json", "w"))
    print(len(lib), "titles")


if __name__ == "__main__":
    build()
