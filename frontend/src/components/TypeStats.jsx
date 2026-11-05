import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { DIR_CATEGORIES, DIR_CATEGORIES_KEY, dirCategory, inDir } from "@/components/DirectoryDropdowns";
import { partsOf, isMultiPart } from "@/lib/multiPart";

const EST_MOVIE_MIN = 88;
const EST_EPISODE_MIN = 45;

// Minutes for one card: real episode/movie runtimes where known, estimates otherwise
function cardMinutes(m) {
  const parts = partsOf(m);
  const isTv = m.media_type === 'tv';
  const fallback = m.runtime || (isTv ? EST_EPISODE_MIN : EST_MOVIE_MIN);
  if (!isMultiPart(m)) {
    return { minutes: fallback, known: m.runtime ? fallback : 0, episodes: isTv ? 1 : 0 };
  }
  let minutes = 0, known = 0, episodes = 0;
  parts.forEach(p => {
    const ep = p.episode;
    if (ep) episodes += ep.last_number ? ep.last_number - ep.number + 1 : 1;
    const min = (ep && ep.runtime) || m.runtime || (isTv || ep ? EST_EPISODE_MIN : EST_MOVIE_MIN);
    minutes += min;
    if ((ep && ep.runtime) || m.runtime) known += min;
  });
  return { minutes, known, episodes };
}

export function computeTypeStats(movies, directories) {
  let categories = {};
  try { categories = JSON.parse(localStorage.getItem(DIR_CATEGORIES_KEY) || '{}'); } catch (e) { categories = {}; }
  const out = {};
  DIR_CATEGORIES.forEach(c => { out[c.id] = { titles: 0, files: 0, episodes: 0, minutes: 0, known: 0 }; });
  movies.forEach(m => {
    const dir = directories.find(d => inDir(m.file_path, d));
    const cat = dir ? dirCategory(categories, dir) : 'movies';
    const t = out[cat] || out.movies;
    const r = cardMinutes(m);
    t.titles++;
    t.files += partsOf(m).length;
    t.episodes += r.episodes;
    t.minutes += r.minutes;
    t.known += r.known;
  });
  return out;
}

function formatHours(minutes) {
  const h = minutes / 60;
  return h >= 100 ? Math.round(h).toLocaleString() : h.toFixed(1);
}

const COLORS = {
  movies: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  tv: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  docs: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  anim: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
};

export function TypeStats({ movies, directories }) {
  const stats = computeTypeStats(movies, directories);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="type-stats">
      {DIR_CATEGORIES.map((cat, i) => {
        const s = stats[cat.id];
        const Icon = cat.icon;
        const estimated = s.minutes > 0 && s.known < s.minutes;
        const knownPct = s.minutes > 0 ? Math.round((s.known / s.minutes) * 100) : 0;
        const days = s.minutes / 60 / 24;
        return (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.03 }}>
            <Card className={'border ' + COLORS[cat.id].split(' ').slice(2).join(' ')} data-testid={`type-stat-${cat.id}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + COLORS[cat.id].split(' ').slice(0, 2).join(' ')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold">{cat.label}</p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-2xl font-bold" data-testid={`type-stat-${cat.id}-titles`}>{s.titles.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">{s.titles === 1 ? 'title' : 'titles'}</p>
                  </div>
                  <div className="text-right">
                    <p className={'text-xl font-bold ' + COLORS[cat.id].split(' ')[0]} data-testid={`type-stat-${cat.id}-hours`} title={estimated ? 'Includes estimates for titles without a known runtime' : 'Based on real runtimes'}>
                      {estimated ? '≈' : ''}{formatHours(s.minutes)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">hours{days >= 1 ? ' · ' + days.toFixed(1) + ' days' : ''}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/80" data-testid={`type-stat-${cat.id}-sub`}>
                  {s.files.toLocaleString()} {s.files === 1 ? 'file' : 'files'}
                  {s.episodes > 0 ? ' · ' + s.episodes.toLocaleString() + ' episodes' : ''}
                  {s.minutes > 0 ? ' · ' + knownPct + '% real runtimes' : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
