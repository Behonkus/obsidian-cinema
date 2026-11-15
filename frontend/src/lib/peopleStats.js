import { isSeries } from "@/lib/multiPart";

const NON_FILM_GENRES = ['Music', 'Documentary'];
const SELF_ROLE = /\b(himself|herself|themselves|self)\b/i;

const genreNames = (m) => (m.genres || []).map(g => (typeof g === 'object' && g ? g.name : g)).filter(g => typeof g === 'string');

// Feature films only: no TV series, concerts/music films or documentaries
export function isFilmCard(m) {
  if (m.media_type === 'tv' || isSeries(m)) return false;
  return !genreNames(m).some(g => NON_FILM_GENRES.includes(g));
}

// Real acting roles only: no "Himself" cameos, musicians or crew billed in the cast
export function isActingCredit(c) {
  if (!c || !c.name) return false;
  if (c.character && SELF_ROLE.test(c.character)) return false;
  return !c.dept || c.dept === 'Acting';
}

export function filmDirectors(m) {
  if (Array.isArray(m.directors) && m.directors.length) return m.directors;
  return String(m.director || '').split(',').map(n => n.trim()).filter(Boolean).map(name => ({ name, profile_path: null }));
}

// Director insights: most films, top rated (min 5 rated films), genre range, favourite actor-director pairs
export function computeDirectorStats(movies) {
  const count = {}, rating = {}, genres = {}, photo = {}, pairs = {};
  let films = 0;
  movies.forEach(m => {
    if (!isFilmCard(m)) return;
    const dirs = filmDirectors(m);
    if (dirs.length === 0) return;
    films++;
    const actors = (m.cast || []).filter(isActingCredit).slice(0, 5);
    dirs.forEach(d => {
      const n = d.name;
      count[n] = (count[n] || 0) + 1;
      if (d.profile_path && !photo[n]) photo[n] = d.profile_path;
      if (m.rating) { rating[n] = rating[n] || { sum: 0, count: 0 }; rating[n].sum += m.rating; rating[n].count++; }
      genres[n] = genres[n] || {};
      genreNames(m).forEach(g => { genres[n][g] = true; });
      actors.forEach(a => {
        if (a.name === n) return;
        const k = a.name + '\u0000' + n;
        pairs[k] = pairs[k] || { actor: a.name, director: n, count: 0, photo: a.profile_path || null };
        pairs[k].count++;
      });
    });
  });
  const names = Object.keys(count);
  const person = n => ({ name: n, photo: photo[n] || null });
  return {
    films,
    uniqueDirectors: names.length,
    mostFilms: names.sort((a, b) => count[b] - count[a]).slice(0, 10).map(n => ({ ...person(n), count: count[n] })),
    topRated: names.filter(n => rating[n] && rating[n].count >= 5)
      .map(n => ({ ...person(n), avgRating: rating[n].sum / rating[n].count, movieCount: rating[n].count }))
      .sort((a, b) => b.avgRating - a.avgRating).slice(0, 10),
    genreRange: names.filter(n => count[n] >= 2)
      .map(n => ({ ...person(n), genreCount: Object.keys(genres[n]).length }))
      .sort((a, b) => b.genreCount - a.genreCount).slice(0, 10),
    pairs: Object.values(pairs).filter(p => p.count >= 2).sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
