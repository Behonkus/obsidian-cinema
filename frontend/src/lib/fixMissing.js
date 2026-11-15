import { tmdbGet, parseFilename, fetchDetails, fetchFullMetadata, normalizeGenres, runPool } from "@/lib/tmdbMatcher";
import { isMultiPart } from "@/lib/multiPart";

const WDQS = 'https://query.wikidata.org/sparql';
const WD_API = 'https://www.wikidata.org/w/api.php';
const RECHECK_MS = 30 * 24 * 60 * 60 * 1000;

export const missingFields = (m) => ({
  rating: !m.rating,
  year: !m.year,
  genres: !(Array.isArray(m.genres) && m.genres.length > 0),
});
export const hasGap = (m) => { const f = missingFields(m); return f.rating || f.year || f.genres; };
// Background pass skips titles already checked in the last 30 days
export const needsAutoFix = (m) => hasGap(m) && !(m.gap_checked_at && Date.now() - m.gap_checked_at < RECHECK_MS);

// Wikidata genre labels ("science fiction film") -> library genres
const WD_GENRES = [
  [/science fiction|sci-fi/, 'Science Fiction'], [/animat|cartoon/, 'Animation'], [/documentary/, 'Documentary'],
  [/action/, 'Action'], [/adventure/, 'Adventure'], [/comedy|comedic/, 'Comedy'], [/drama/, 'Drama'],
  [/horror|slasher/, 'Horror'], [/thriller|suspense/, 'Thriller'], [/romance|romantic/, 'Romance'],
  [/fantasy/, 'Fantasy'], [/crime|gangster|heist|noir/, 'Crime'], [/\bwar\b/, 'War'], [/western/, 'Western'],
  [/musical|\bmusic/, 'Music'], [/mystery|detective/, 'Mystery'], [/family|children/, 'Family'],
  [/histor|biograph|period/, 'History'],
];
export function mapWikidataGenres(labels) {
  const out = [];
  (labels || []).forEach(l => {
    const s = String(l).toLowerCase();
    WD_GENRES.forEach(([re, g]) => { if (re.test(s) && !out.includes(g)) out.push(g); });
  });
  return out;
}

// Wikidata review scores ("7.8/10", "93%", "74/100") -> 0-10 rating, IMDb preferred
export function scoreFromWikidata(scores) {
  const parse = (v) => {
    const s = String(v || '').trim();
    let m = s.match(/^([\d.]+)\s*\/\s*10$/);
    if (m) return parseFloat(m[1]);
    m = s.match(/^([\d.]+)\s*%$/);
    if (m) return parseFloat(m[1]) / 10;
    m = s.match(/^([\d.]+)\s*\/\s*100$/);
    if (m) return parseFloat(m[1]) / 10;
    return null;
  };
  const rank = (by) => (/imdb/i.test(by || '') ? 0 : /metacritic/i.test(by || '') ? 1 : /rotten/i.test(by || '') ? 2 : 3);
  const vals = (scores || []).map(s => ({ v: parse(s.score), r: rank(s.by) })).filter(s => s.v != null && s.v > 0 && s.v <= 10);
  if (vals.length === 0) return null;
  vals.sort((a, b) => a.r - b.r);
  return Math.round(vals[0].v * 10) / 10;
}

async function sparql(query) {
  const res = await fetch(WDQS + '?format=json&query=' + encodeURIComponent(query), { headers: { Accept: 'application/sparql-results+json' } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results && data.results.bindings) || [];
}

function collect(rows, keyName) {
  const by = {};
  rows.forEach(r => {
    const k = r[keyName] && r[keyName].value;
    if (!k) return;
    const e = by[k] || (by[k] = { years: [], genres: [], scores: [] });
    if (r.pub) { const y = parseInt(r.pub.value.slice(0, 4), 10); if (y) e.years.push(y); }
    if (r.genreLabel && !e.genres.includes(r.genreLabel.value)) e.genres.push(r.genreLabel.value);
    if (r.score) e.scores.push({ score: r.score.value, by: r.byLabel && r.byLabel.value });
  });
  Object.values(by).forEach(e => {
    e.year = e.years.length ? Math.min(...e.years) : null;
    e.genres = mapWikidataGenres(e.genres);
    e.rating = scoreFromWikidata(e.scores);
  });
  return by;
}

const FIELDS = `OPTIONAL { ?item wdt:P577 ?pub }
  OPTIONAL { ?item wdt:P136 ?genre }
  OPTIONAL { ?item p:P444 ?st . ?st ps:P444 ?score . OPTIONAL { ?st pq:P447 ?by } }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`;

// Look up many titles at once by IMDb / TMDB id
async function wikidataByIds(movies) {
  const out = {};
  const imdb = [...new Set(movies.map(m => m.imdb_id).filter(Boolean))];
  const tmdbMovie = [...new Set(movies.filter(m => m.tmdb_id && m.media_type !== 'tv').map(m => String(m.tmdb_id)))];
  const tmdbTv = [...new Set(movies.filter(m => m.tmdb_id && m.media_type === 'tv').map(m => String(m.tmdb_id)))];
  const run = async (ids, prop, tag) => {
    for (let i = 0; i < ids.length; i += 50) {
      const values = ids.slice(i, i + 50).map(id => JSON.stringify(id)).join(' ');
      const rows = await sparql(`SELECT ?id ?pub ?genreLabel ?score ?byLabel WHERE { VALUES ?id { ${values} } ?item wdt:${prop} ?id . ${FIELDS} }`).catch(() => []);
      const got = collect(rows, 'id');
      Object.keys(got).forEach(k => { out[tag + k] = got[k]; });
    }
  };
  await run(imdb, 'P345', 'imdb:');
  await run(tmdbMovie, 'P4947', 'tmdb:');
  await run(tmdbTv, 'P4983', 'tmdbtv:');
  return out;
}

// Unmatched titles: search Wikidata by name, accept a film / series whose year agrees
async function wikidataByTitle(movie) {
  const parsed = parseFilename(movie.file_name || movie.title);
  const title = parsed.title || movie.title;
  if (!title) return null;
  const year = movie.year || parsed.year;
  const res = await fetch(WD_API + '?action=wbsearchentities&format=json&origin=*&language=en&type=item&limit=7&search=' + encodeURIComponent(title)).then(r => r.json()).catch(() => null);
  const hits = ((res && res.search) || []).filter(h => /film|movie|series|documentary|animated/i.test(h.description || ''));
  if (hits.length === 0) return null;
  const values = hits.map(h => 'wd:' + h.id).join(' ');
  const rows = await sparql(`SELECT ?id ?pub ?genreLabel ?score ?byLabel WHERE { VALUES ?item { ${values} } BIND(STR(?item) AS ?id) ${FIELDS} }`).catch(() => []);
  const got = collect(rows, 'id');
  const pick = hits.map(h => got['http://www.wikidata.org/entity/' + h.id]).filter(Boolean)
    .find(e => (year ? e.year && Math.abs(e.year - year) <= 1 : true));
  return pick || null;
}

// Year in a file or folder name
const nameYear = (m) => parseFilename(m.file_name).year
  || parseFilename(String(m.file_path || '').split(/[\\/]/).slice(-2, -1)[0] || '').year || null;

// Fill the gaps of a batch of titles. Returns { updates: {id: fields}, mismatches: [...] }
export async function fixMissingInfo(movies, { apiKey, categoryOf, onProgress, shouldStop } = {}) {
  const updates = {};
  const tmdbYears = {};
  const set = (m, fields) => { updates[m.id] = { ...(updates[m.id] || {}), ...fields }; };
  const current = (m) => ({ ...m, ...(updates[m.id] || {}) });
  let done = 0;
  const total = movies.length;
  const tick = () => { done++; if (onProgress) onProgress(done, total); };

  // 1) TMDB: refresh matched titles, match unmatched ones
  if (apiKey) {
    await runPool(movies, async (m) => {
      if (shouldStop && shouldStop()) return;
      const gap = missingFields(m);
      try {
        if (m.tmdb_id) {
          const d = await fetchDetails(m.tmdb_id, m.media_type, apiKey);
          if (d) {
            if (m.media_type !== 'tv' && d.year) tmdbYears[m.id] = d.year;
            const f = {};
            if (gap.rating && d.rating) f.rating = d.rating;
            if (gap.year && d.year) f.year = d.year;
            if (gap.genres && d.genres && d.genres.length) f.genres = d.genres;
            if (Object.keys(f).length) set(m, f);
          }
        } else {
          const d = await fetchFullMetadata(m, apiKey);
          if (d && !d.needs_review) {
            set(m, { ...d, metadata_updated_at: Date.now() });
            if (d.media_type !== 'tv' && d.release_date) tmdbYears[m.id] = parseInt(d.release_date.slice(0, 4), 10);
          }
        }
      } catch (e) { /* keep going */ }
    }, { concurrency: 3, onResult: tick, shouldStop });
  } else {
    movies.forEach(tick);
  }

  // 2) Wikidata for whatever TMDB could not fill (a 0 rating counts as missing)
  const still = movies.map(current).filter(hasGap);
  if (still.length && !(shouldStop && shouldStop())) {
    const byId = await wikidataByIds(still).catch(() => ({}));
    for (const m of still) {
      if (shouldStop && shouldStop()) break;
      let e = (m.imdb_id && byId['imdb:' + m.imdb_id])
        || (m.tmdb_id && byId[(m.media_type === 'tv' ? 'tmdbtv:' : 'tmdb:') + m.tmdb_id]) || null;
      if (!e && !m.tmdb_id && !m.imdb_id) e = await wikidataByTitle(m).catch(() => null);
      if (!e) continue;
      const gap = missingFields(m);
      const f = {};
      if (gap.rating && e.rating) { f.rating = e.rating; f.rating_source = 'wikidata'; }
      if (gap.year && e.year) f.year = e.year;
      if (gap.genres && e.genres.length) f.genres = e.genres;
      if (Object.keys(f).length) set(m, f);
      if (!tmdbYears[m.id] && e.year && m.media_type !== 'tv') tmdbYears[m.id] = e.year;
    }
  }

  // 3) Local clues: year from the file / folder name, genre from the folder type
  movies.map(current).forEach(m => {
    const gap = missingFields(m);
    const f = {};
    if (gap.year) { const y = nameYear(m); if (y) f.year = y; }
    if (gap.genres && categoryOf) {
      const cat = categoryOf(m);
      if (cat === 'anim') f.genres = ['Animation'];
      if (cat === 'docs') f.genres = ['Documentary'];
    }
    if (Object.keys(f).length) set(m, f);
  });

  // Every checked title is stamped so the background pass does not repeat it for a while
  movies.forEach(m => {
    const u = updates[m.id] || {};
    set(m, u.genres ? { gap_checked_at: Date.now(), genres: normalizeGenres(u.genres) } : { gap_checked_at: Date.now() });
  });

  // File names whose year disagrees with the found release year (single-file titles only)
  const mismatches = [];
  movies.forEach(m => {
    const found = tmdbYears[m.id];
    const fileYear = parseFilename(m.file_name).year;
    if (!found || !fileYear || found === fileYear || isMultiPart(m)) return;
    mismatches.push({ id: m.id, title: current(m).title, file_path: m.file_path, file_name: m.file_name, fileYear, foundYear: found, newName: renameYear(m.file_name, fileYear, found) });
  });
  return { updates, mismatches };
}

// Replace only the year in a file name: "Heat (1996).mkv" -> "Heat (1995).mkv"
export function renameYear(fileName, fromYear, toYear) {
  const s = String(fileName);
  const idx = s.lastIndexOf(String(fromYear));
  if (idx < 0) return s;
  return s.slice(0, idx) + String(toYear) + s.slice(idx + 4);
}
