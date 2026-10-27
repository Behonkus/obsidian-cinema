// Smart TMDB matching + rich metadata + rate-limited concurrent fetching
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const TMDB_PROFILE = 'https://image.tmdb.org/t/p/w185';
const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w780';

export const MATCH_THRESHOLD = 0.55;
export const LOW_CONFIDENCE = 0.75;

const RELEASE_TAGS = /\b(2160p|1080p|1080i|720p|576p|480p|4k|uhd|hdr10?|hdr|dv|dolby ?vision|bluray|blu ray|brrip|bdrip|bdremux|remux|web ?dl|webrip|web|hdtv|dvdrip|dvdscr|dvd|hdrip|hdcam|cam|ts|x264|x265|h ?264|h ?265|hevc|avc|xvid|divx|10bit|8bit|aac(2 0|5 1)?|ac3|eac3|dts(-hd)?|truehd|atmos|ddp?5 1|dd5 1|5 1|7 1|2 0|yify|yts|rarbg|ettv|evo|fgt|sparks|amzn|nf|hulu|dsnp|hmax|proper|repack|extended|unrated|uncut|directors cut|director s cut|theatrical|remastered|criterion|imax|limited|internal|multi|dual audio|subbed|dubbed|eng|english|ita|fre|french|ger|german|spa|hindi|sample)\b.*$/i;

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeTitle(s) {
  return stripAccents(String(s || '').toLowerCase())
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^(the|a|an) /, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse a raw file name into a clean title, year and optional IMDb id
export function parseFilename(fileName) {
  const raw = String(fileName || '').replace(/\.[a-z0-9]{2,4}$/i, '');
  const imdbMatch = raw.match(/\btt\d{7,8}\b/i);
  let s = raw.replace(/\btt\d{7,8}\b/ig, ' ').replace(/[._]/g, ' ');
  // Prefer the last bracketed year, else the last standalone year that is not the whole title
  let year = null;
  const maxYear = new Date().getFullYear() + 2;
  const okYear = m => { const y = parseInt(m[1], 10); return y >= 1888 && y <= maxYear; };
  const bracketYears = [...s.matchAll(/[([{]\s*((?:19|20)\d{2})\s*[)\]}]/g)].filter(okYear);
  let cutIndex = -1;
  if (bracketYears.length) {
    const m = bracketYears[bracketYears.length - 1];
    year = parseInt(m[1], 10);
    cutIndex = m.index;
  } else {
    const loose = [...s.matchAll(/(?:^|\s|-)((?:19|20)\d{2})(?=\s|-|$)/g)].filter(m => m.index > 0 && okYear(m));
    if (loose.length) {
      const m = loose[loose.length - 1];
      year = parseInt(m[1], 10);
      cutIndex = m.index;
    }
  }
  let title = cutIndex > 0 ? s.slice(0, cutIndex) : s;
  title = title
    .replace(/[[{(][^\]})]*[\]})]/g, ' ')
    .replace(RELEASE_TAGS, ' ')
    .replace(/[-–—]+\s*$/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) title = raw.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
  return { title, year, imdb_id: imdbMatch ? imdbMatch[0].toLowerCase() : null };
}

// Mirrors the original scanner so untouched titles can be detected
function legacyParse(fileName) {
  const name = String(fileName || '').replace(/\.[^.]+$/, '');
  const ym = name.match(/[([\s]*(19|20)\d{2}[)\]\s]*/);
  const year = ym ? parseInt(ym[0].replace(/[()[\]\s]/g, ''), 10) : null;
  const title = name.replace(/[([\s]*(19|20)\d{2}[)\]\s]*/g, '').replace(/\./g, ' ').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  return { title, year };
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function titleSimilarity(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const lev = 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
  const ta = new Set(na.split(' '));
  const tb = new Set(nb.split(' '));
  let inter = 0;
  ta.forEach(t => { if (tb.has(t)) inter++; });
  const jaccard = inter / (ta.size + tb.size - inter);
  return Math.max(lev, jaccard * 0.95);
}

// Score a TMDB search result against the parsed query (0..1)
export function scoreCandidate(candidate, query) {
  const titles = [candidate.title, candidate.original_title].filter(Boolean);
  let sim = 0;
  query.titles.forEach(q => titles.forEach(t => { sim = Math.max(sim, titleSimilarity(q, t)); }));
  const cYear = candidate.release_date ? parseInt(candidate.release_date.slice(0, 4), 10) : null;
  let yearScore = 0.5;
  if (query.year && cYear) {
    const diff = Math.abs(query.year - cYear);
    yearScore = diff === 0 ? 1 : diff === 1 ? 0.8 : diff <= 3 ? 0.3 : 0;
  } else if (query.year && !cYear) {
    yearScore = 0.2;
  }
  const pop = Math.min(1, Math.log10((candidate.vote_count || 0) + 1) / 4);
  const hasYear = !!query.year;
  const score = hasYear ? sim * 0.65 + yearScore * 0.28 + pop * 0.07 : sim * 0.85 + pop * 0.15;
  return Math.round(score * 1000) / 1000;
}

// Rate-limited fetch with retry on 429 / network failures
let lastRequests = [];
async function throttle() {
  const now = Date.now();
  lastRequests = lastRequests.filter(t => now - t < 1000);
  if (lastRequests.length >= 35) {
    await new Promise(r => setTimeout(r, 1000 - (now - lastRequests[0]) + 10));
    return throttle();
  }
  lastRequests.push(Date.now());
}

async function tmdbGet(path, apiKey, params = {}, attempt = 0) {
  await throttle();
  const qs = new URLSearchParams({ api_key: apiKey, ...params }).toString();
  try {
    const resp = await fetch(`${TMDB_API}${path}?${qs}`);
    if (resp.status === 429 && attempt < 4) {
      const wait = (parseInt(resp.headers.get('Retry-After') || '1', 10) || 1) * 1000;
      await new Promise(r => setTimeout(r, wait + attempt * 500));
      return tmdbGet(path, apiKey, params, attempt + 1);
    }
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
      return tmdbGet(path, apiKey, params, attempt + 1);
    }
    return null;
  }
}

function titleVariants(title) {
  const out = [title];
  const noSub = title.split(/\s+[-–:]\s+|:\s*/)[0];
  if (noSub && noSub !== title && noSub.length > 2) out.push(noSub);
  const noArticleEnd = title.replace(/,\s*(the|a|an)$/i, '');
  if (noArticleEnd !== title) out.push(noArticleEnd);
  const andFix = title.replace(/\s+and\s+/i, ' & ');
  if (andFix !== title) out.push(andFix);
  return [...new Set(out.map(t => t.trim()).filter(Boolean))];
}

// Find the best TMDB match for a library movie
export async function findBestMatch(movie, apiKey) {
  const parsed = parseFilename(movie.file_name || movie.title);
  const imdbId = movie.imdb_id || parsed.imdb_id;
  if (imdbId) {
    const found = await tmdbGet(`/find/${imdbId}`, apiKey, { external_source: 'imdb_id' });
    if (found && found.movie_results && found.movie_results.length) {
      return { candidate: found.movie_results[0], confidence: 1, method: 'imdb_id' };
    }
  }
  const baseTitles = [...new Set([movie.title, parsed.title].filter(Boolean).map(String))];
  const year = movie.year || parsed.year || null;
  const query = { titles: baseTitles, year };
  const seen = new Map();
  let best = null;
  const consider = (results) => {
    (results || []).slice(0, 10).forEach(r => {
      if (seen.has(r.id)) return;
      const score = scoreCandidate(r, query);
      seen.set(r.id, score);
      if (!best || score > best.confidence) best = { candidate: r, confidence: score, method: 'search' };
    });
  };
  const searches = [];
  baseTitles.forEach(t => titleVariants(t).forEach(v => searches.push(v)));
  const uniqueSearches = [...new Set(searches)];
  for (const q of uniqueSearches) {
    if (year) {
      const r1 = await tmdbGet('/search/movie', apiKey, { query: q, primary_release_year: year, include_adult: 'false' });
      consider(r1 && r1.results);
      if (best && best.confidence >= 0.92) return best;
    }
    const r2 = await tmdbGet('/search/movie', apiKey, { query: q, include_adult: 'false' });
    consider(r2 && r2.results);
    if (best && best.confidence >= (year ? 0.85 : 0.8)) return best;
  }
  return best && best.confidence >= MATCH_THRESHOLD ? best : (best ? { ...best, rejected: true } : null);
}

// Single request for all rich metadata
export async function fetchMovieDetails(tmdbId, apiKey) {
  const d = await tmdbGet(`/movie/${tmdbId}`, apiKey, { append_to_response: 'credits,release_dates,external_ids' });
  if (!d || !d.id) return null;
  const crew = (d.credits && d.credits.crew) || [];
  const directors = crew.filter(c => c.job === 'Director').map(c => c.name);
  const writers = [...new Set(crew.filter(c => c.department === 'Writing').map(c => c.name))].slice(0, 3);
  let certification = null;
  const rd = (d.release_dates && d.release_dates.results) || [];
  const us = rd.find(r => r.iso_3166_1 === 'US');
  if (us) {
    const c = us.release_dates.find(x => x.certification);
    if (c) certification = c.certification;
  }
  const out = {
    tmdb_id: d.id,
    poster_path: d.poster_path ? TMDB_IMG + d.poster_path : null,
    backdrop_path: d.backdrop_path ? TMDB_BACKDROP + d.backdrop_path : null,
    overview: d.overview || null,
    rating: d.vote_average || null,
    vote_count: d.vote_count || 0,
    release_date: d.release_date || null,
    year: d.release_date ? parseInt(d.release_date.slice(0, 4), 10) : null,
    genres: (d.genres || []).map(g => g.name),
    runtime: d.runtime || null,
    tagline: d.tagline || null,
    director: directors.join(', ') || null,
    writers: writers.length ? writers : null,
    certification,
    imdb_id: d.imdb_id || (d.external_ids && d.external_ids.imdb_id) || null,
    original_title: d.original_title || null,
    original_language: d.original_language || null,
    tmdb_title: d.title || null,
    collection_name: d.belongs_to_collection ? d.belongs_to_collection.name : null,
    studios: (d.production_companies || []).slice(0, 3).map(c => c.name),
    countries: (d.production_countries || []).map(c => c.iso_3166_1),
    cast: ((d.credits && d.credits.cast) || []).slice(0, 10).map(c => ({
      name: c.name,
      character: c.character,
      profile_path: c.profile_path ? TMDB_PROFILE + c.profile_path : null,
    })),
    metadata_updated_at: Date.now(),
  };
  return out;
}

// Match + details. Never overwrites a user-set year/title; returns merge-ready fields.
export async function fetchFullMetadata(movie, apiKey) {
  const match = await findBestMatch(movie, apiKey);
  if (!match || match.rejected) return null;
  const details = await fetchMovieDetails(match.candidate.id, apiKey);
  if (!details) return null;
  details.match_confidence = match.confidence;
  details.match_method = match.method;
  details.needs_review = match.confidence < LOW_CONFIDENCE;
  const legacy = legacyParse(movie.file_name);
  const parsed = parseFilename(movie.file_name);
  // Only clean titles/years the user never edited (still equal to the old parser output)
  if (movie.file_name && movie.title === legacy.title && parsed.title && parsed.title !== movie.title) details.title = parsed.title;
  const yearUntouched = movie.year && movie.year === legacy.year;
  if (movie.year && !(yearUntouched && parsed.year && parsed.year !== movie.year)) delete details.year;
  else if (yearUntouched && parsed.year) details.year = parsed.year;
  return details;
}

// Run async tasks with limited concurrency; onResult called per item
export async function runPool(items, worker, { concurrency = 6, onResult, shouldStop } = {}) {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      if (shouldStop && shouldStop()) return;
      const i = index++;
      let result = null;
      try { result = await worker(items[i], i); } catch (e) { result = null; }
      if (onResult) onResult(items[i], result, i);
    }
  });
  await Promise.all(runners);
}

// Downsize TMDB image URLs for grid thumbnails
export function thumbUrl(url, size) {
  if (!url || typeof url !== 'string' || url.indexOf('image.tmdb.org') === -1) return url;
  return url.replace(/\/t\/p\/w\d+\//, `/t/p/${size}/`);
}
