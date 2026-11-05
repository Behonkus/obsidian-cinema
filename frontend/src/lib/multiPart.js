// Multi-part titles (documentary episodes, CD1/CD2, Part 1/2...) consolidated into one card
import { parseFilename, tmdbGet } from "@/lib/tmdbMatcher";

const TMDB_STILL = 'https://image.tmdb.org/t/p/w300';

// Attach TMDB episode info to each part of a series card (S01E03 -> season 1 ep 3, Part 3 -> season 1 ep 3)
export async function attachEpisodes(parts, tvId, apiKey) {
  const mapped = parts.filter(p => !partFolder(p.file_path).extra).map((p, i) => {
    const info = partNum(p);
    const folderSeason = partFolder(p.file_path).season;
    if (folderSeason != null && info && info.num < 1000) return { part: p, season: folderSeason, episode: info.num, lastEpisode: info.num };
    if (info && info.num >= 1000) return { part: p, season: Math.floor(info.num / 1000), episode: info.num % 1000, lastEpisode: info.endNum % 1000 };
    const n = info ? info.num : i + 1;
    return { part: p, season: 1, episode: n, lastEpisode: n };
  });
  const seasons = [...new Set(mapped.map(m => m.season))];
  const bySeason = {};
  for (const s of seasons) {
    const data = await tmdbGet(`/tv/${tvId}/season/${s}`, apiKey);
    bySeason[s] = (data && data.episodes) || [];
  }
  let found = 0;
  const matchedPaths = new Set();
  const episodeParts = mapped.map(({ part, season, episode, lastEpisode }) => {
    const eps = (bySeason[season] || []).filter(e => e.episode_number >= episode && e.episode_number <= lastEpisode)
      .sort((a, b) => a.episode_number - b.episode_number);
    const clean = { file_path: part.file_path, file_name: part.file_name };
    if (eps.length === 0) return clean;
    matchedPaths.add(part.file_path);
    found++;
    const first = eps[0];
    const runtime = eps.reduce((t, e) => t + (e.runtime || 0), 0);
    return {
      ...clean,
      episode: {
        season,
        number: episode,
        last_number: eps.length > 1 ? eps[eps.length - 1].episode_number : null,
        name: eps.map(e => e.name).filter(Boolean).join(' / ') || null,
        overview: eps.map(e => e.overview).filter(Boolean).join('\n\n') || null,
        still: first.still_path ? TMDB_STILL + first.still_path : null,
        runtime: runtime || null,
        air_date: first.air_date || null,
      },
    };
  });
  const byPath = {};
  episodeParts.forEach(p => { byPath[p.file_path] = p; });
  const out = parts.map(p => byPath[p.file_path] || { file_path: p.file_path, file_name: p.file_name });
  return { parts: out, found };
}

export const MULTIPART_DISMISSED_KEY = 'obsidian_cinema_multipart_dismissed';

const PART_PATTERNS = [
  /\bS(\d{1,2})[\s._-]?E(\d{1,3})((?:(?:[-_.]?E|-)\d{1,3})*)\b/i,
  /(?:^|[\s._\-([])(?:part|pt|cd|disc|disk|dvd|episode|ep)[\s._-]*(\d{1,2})(?=$|[\s._\-)\]]|of\b)/i,
  /(?:^|[\s._\-([])(\d{1,2})[\s._-]*of[\s._-]*\d{1,2}(?=$|[\s._\-)\]])/i,
  /(?:^|[\s._-])E(\d{1,3})(?=$|[\s._-])/,
];

// Returns { base, num } when a file name looks like one part of a multi-part title
export function partInfo(fileName) {
  const name = String(fileName || '').replace(/\.[a-z0-9]{2,4}$/i, '');
  for (let i = 0; i < PART_PATTERNS.length; i++) {
    const m = name.match(PART_PATTERNS[i]);
    if (!m) continue;
    const num = i === 0 ? parseInt(m[1], 10) * 1000 + parseInt(m[2], 10) : parseInt(m[1], 10);
    const before = name.slice(0, m.index).replace(/[\s._\-([]+$/, '');
    if (!before) continue;
    const base = parseFilename(before).title;
    if (!base) continue;
    // Double/multi episodes: S07E12E13, S07E12-E13, S07E12-13
    let endNum = num;
    if (i === 0 && m[3]) {
      const extra = (m[3].match(/\d{1,3}/g) || []).map(n => parseInt(n, 10));
      const last = extra[extra.length - 1];
      if (last > parseInt(m[2], 10) && last - parseInt(m[2], 10) <= 10) endNum = parseInt(m[1], 10) * 1000 + last;
    }
    return { base, num, endNum };
  }
  return null;
}

function dirOf(p) {
  return String(p || '').replace(/[\\/][^\\/]*$/, '');
}

function baseName(p) {
  return String(p || '').split(/[\\/]/).pop();
}

const SEASON_DIR = /^(?:season|series|staffel|saison|temporada|s)[\s._-]*(\d{1,2})(?:\b.*)?$/i;
const SPECIALS_DIR = /^specials?$/i;
const EXTRAS_DIR = /^(?:extras?|bonus(?:[\s._-]*(?:features|material|content))?|featurettes?|special[\s._-]*features|behind[\s._-]*the[\s._-]*scenes|deleted[\s._-]*scenes|interviews?|trailers?|making[\s._-]*of)$/i;

// Folder role of a file: inside a Season N / Specials folder, or an Extras folder of a show
export function partFolder(filePath) {
  const dir = dirOf(filePath);
  const name = baseName(dir).trim();
  const showDir = dirOf(dir);
  if (!showDir || showDir === dir) return {};
  const sm = name.match(SEASON_DIR);
  if (sm) return { showDir, season: parseInt(sm[1], 10) };
  if (SPECIALS_DIR.test(name)) return { showDir, season: 0 };
  if (EXTRAS_DIR.test(name)) return { showDir, extra: true };
  return {};
}

// Episode number of a part: from the name (S01E03 / Part 3 / E03) or, inside a season folder, a leading "03 - Title"
function partNum(part) {
  const info = partInfo(part.file_name);
  if (info) return info;
  if (partFolder(part.file_path).season == null) return null;
  const m = String(part.file_name || '').match(/^\s*(?:e|ep|episode)?[\s._-]*(\d{1,3})(?=[\s._\-)\]]|$)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return { base: '', num: n, endNum: n };
}

// Section a part belongs to in the parts list: 'Season 2', 'Specials', 'Extras' or null
export function partSection(part) {
  const f = partFolder(part.file_path);
  if (f.extra) return 'Extras';
  const info = partNum(part);
  const season = info && info.num >= 1000 ? Math.floor(info.num / 1000) : f.season;
  if (season == null) return null;
  return season === 0 ? 'Specials' : 'Season ' + season;
}

function partSortKey(part) {
  const f = partFolder(part.file_path);
  if (f.extra) return 1e7;
  const info = partNum(part);
  if (info && info.num >= 1000) return info.num;
  if (f.season != null) return f.season * 1000 + (info ? info.num : 999);
  return info ? info.num : 999;
}

function normKey(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function partsOf(movie) {
  if (Array.isArray(movie.parts) && movie.parts.length > 0) return movie.parts;
  return [{ file_path: movie.file_path, file_name: movie.file_name }];
}

export function isMultiPart(movie) {
  return Array.isArray(movie.parts) && movie.parts.length > 1;
}

// Every file path the library knows about, including merged parts
export function allLibraryPaths(movies) {
  const set = new Set();
  movies.forEach(m => partsOf(m).forEach(p => { if (p.file_path) set.add(p.file_path); }));
  return set;
}

export function partLabel(part, index) {
  const f = partFolder(part.file_path);
  if (f.extra) return 'Extra';
  const info = partNum(part);
  if (info && info.num < 1000 && f.season != null) {
    return 'S' + String(f.season).padStart(2, '0') + 'E' + String(info.num).padStart(2, '0');
  }
  if (info && info.num >= 1000) {
    const s = Math.floor(info.num / 1000);
    const e = info.num % 1000;
    const label = 'S' + String(s).padStart(2, '0') + 'E' + String(e).padStart(2, '0');
    return info.endNum > info.num ? label + '-E' + String(info.endNum % 1000).padStart(2, '0') : label;
  }
  return 'Part ' + (info ? info.num : index + 1);
}

// Suggest groups of separate cards that look like parts of one title (same folder + same base name)
export function findPartGroups(movies, dismissed) {
  const dismissedSet = new Set(dismissed || []);
  const groups = {};
  // 1) Whole shows: cards inside Season N / Specials / Extras folders of the same show folder
  const shows = {};
  movies.forEach(m => {
    const f = partFolder(partsOf(m)[0].file_path);
    if (!f.showDir) return;
    const key = 'show|' + f.showDir.toLowerCase();
    if (!shows[key]) shows[key] = { key, showDir: f.showDir, cards: [], hasSeason: false };
    shows[key].cards.push(m);
    if (f.season != null) shows[key].hasSeason = true;
  });
  const inShow = new Set();
  Object.values(shows).forEach(sh => {
    const loose = movies.filter(m => !isMultiPart(m) && dirOf(m.file_path).toLowerCase() === sh.showDir.toLowerCase());
    // A single movie in the show folder with an Extras folder also counts (movie + extras)
    if (!sh.hasSeason && loose.length !== 1) return;
    const cards = loose.length === 1 && !sh.hasSeason ? [...loose, ...sh.cards] : sh.cards;
    if (cards.length < 2 || dismissedSet.has(sh.key)) return;
    cards.forEach(c => inShow.add(c.id));
    const parsed = parseFilename(baseName(sh.showDir));
    const sorted = cards.slice().sort((a, b) => partSortKey(partsOf(a)[0]) - partSortKey(partsOf(b)[0]));
    groups[sh.key] = { key: sh.key, title: parsed.title || baseName(sh.showDir), year: parsed.year || null, show: true, members: sorted };
  });
  // 2) Numbered parts in the same folder with the same base name
  const loose = {};
  movies.forEach(m => {
    if (isMultiPart(m) || inShow.has(m.id)) return;
    const info = partInfo(m.file_name);
    if (!info) return;
    const key = dirOf(m.file_path).toLowerCase() + '|' + normKey(info.base);
    if (dismissedSet.has(key)) return;
    if (!loose[key]) loose[key] = { key, title: info.base, members: [] };
    loose[key].members.push({ movie: m, num: info.num });
  });
  const partGroups = Object.values(loose)
    .filter(g => g.members.length > 1 && new Set(g.members.map(x => x.num)).size > 1)
    .filter(g => new Set(g.members.map(x => x.movie.year).filter(Boolean)).size <= 1)
    .map(g => ({ ...g, members: g.members.sort((a, b) => a.num - b.num).map(x => x.movie) }));
  return [...Object.values(groups), ...partGroups].sort((a, b) => a.title.localeCompare(b.title));
}

function sortParts(parts) {
  return parts.slice().sort((a, b) => {
    const ka = partSortKey(a);
    const kb = partSortKey(b);
    if (ka !== kb) return ka - kb;
    return String(a.file_name).localeCompare(String(b.file_name), undefined, { numeric: true });
  });
}

// Merge cards into one; keeps the card with the best metadata as the main one
export function mergeIntoOne(cards, title, year) {
  const score = m => (m.tmdb_id ? 4 : 0) + (m.poster_path ? 2 : 0) + (m.overview ? 1 : 0);
  const primary = cards.slice().sort((a, b) => score(b) - score(a))[0];
  const seen = new Set();
  const parts = sortParts(cards.flatMap(partsOf)).filter(p => {
    if (!p.file_path || seen.has(p.file_path)) return false;
    seen.add(p.file_path);
    return true;
  }).map(p => (p.episode ? { file_path: p.file_path, file_name: p.file_name, episode: p.episode } : { file_path: p.file_path, file_name: p.file_name }));
  const addedAt = Math.min.apply(null, cards.map(c => c.added_at || Date.now()));
  return {
    ...primary,
    title: title || primary.title,
    year: primary.year || year || null,
    parts,
    file_path: parts[0].file_path,
    file_name: parts[0].file_name,
    added_at: addedAt,
  };
}

// Split a multi-part card back into separate cards (main card keeps its metadata)
export function splitParts(movie) {
  const parts = partsOf(movie);
  const main = { ...movie, file_path: parts[0].file_path, file_name: parts[0].file_name };
  delete main.parts;
  const rest = parts.slice(1).map((p, i) => {
    const parsed = parseFilename(p.file_name);
    return {
      id: Date.now().toString() + i + Math.random().toString(36).slice(2, 7),
      file_path: p.file_path,
      file_name: p.file_name,
      title: parsed.title || p.file_name,
      year: parsed.year || null,
      added_at: movie.added_at || Date.now(),
    };
  });
  return [main, ...rest];
}
