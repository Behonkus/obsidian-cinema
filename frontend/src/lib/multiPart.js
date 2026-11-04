// Multi-part titles (documentary episodes, CD1/CD2, Part 1/2...) consolidated into one card
import { parseFilename } from "@/lib/tmdbMatcher";

export const MULTIPART_DISMISSED_KEY = 'obsidian_cinema_multipart_dismissed';

const PART_PATTERNS = [
  /\bS(\d{1,2})[\s._-]?E(\d{1,3})\b/i,
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
    return { base, num };
  }
  return null;
}

function dirOf(p) {
  return String(p || '').replace(/[\\/][^\\/]*$/, '');
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
  const info = partInfo(part.file_name);
  if (info && info.num >= 1000) {
    const s = Math.floor(info.num / 1000);
    const e = info.num % 1000;
    return 'S' + String(s).padStart(2, '0') + 'E' + String(e).padStart(2, '0');
  }
  return 'Part ' + (info ? info.num : index + 1);
}

// Suggest groups of separate cards that look like parts of one title (same folder + same base name)
export function findPartGroups(movies, dismissed) {
  const dismissedSet = new Set(dismissed || []);
  const groups = {};
  movies.forEach(m => {
    if (isMultiPart(m)) return;
    const info = partInfo(m.file_name);
    if (!info) return;
    const key = dirOf(m.file_path).toLowerCase() + '|' + normKey(info.base);
    if (dismissedSet.has(key)) return;
    if (!groups[key]) groups[key] = { key, title: info.base, members: [] };
    groups[key].members.push({ movie: m, num: info.num });
  });
  return Object.values(groups)
    .filter(g => g.members.length > 1 && new Set(g.members.map(x => x.num)).size > 1)
    .filter(g => new Set(g.members.map(x => x.movie.year).filter(Boolean)).size <= 1)
    .map(g => ({ ...g, members: g.members.sort((a, b) => a.num - b.num).map(x => x.movie) }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function sortParts(parts) {
  return parts.slice().sort((a, b) => {
    const ia = partInfo(a.file_name);
    const ib = partInfo(b.file_name);
    if (ia && ib && ia.num !== ib.num) return ia.num - ib.num;
    return String(a.file_name).localeCompare(String(b.file_name), undefined, { numeric: true });
  });
}

// Merge cards into one; keeps the card with the best metadata as the main one
export function mergeIntoOne(cards, title) {
  const score = m => (m.tmdb_id ? 4 : 0) + (m.poster_path ? 2 : 0) + (m.overview ? 1 : 0);
  const primary = cards.slice().sort((a, b) => score(b) - score(a))[0];
  const seen = new Set();
  const parts = sortParts(cards.flatMap(partsOf)).filter(p => {
    if (!p.file_path || seen.has(p.file_path)) return false;
    seen.add(p.file_path);
    return true;
  }).map(p => ({ file_path: p.file_path, file_name: p.file_name }));
  const addedAt = Math.min.apply(null, cards.map(c => c.added_at || Date.now()));
  return {
    ...primary,
    title: title || primary.title,
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
