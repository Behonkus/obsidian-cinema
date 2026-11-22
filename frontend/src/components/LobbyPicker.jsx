import { useMemo, useState } from "react";
import { Tv, Shuffle, Heart, Film, Layers, FolderHeart, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SPEEDS, getSlideshowSpeed, setSlideshowSpeed } from "@/components/SlideshowControls";

const genreName = (g) => (typeof g === 'object' && g?.name ? g.name : String(g));

// One poster per title (TV episodes share a poster)
export const uniquePosters = (list) => {
  const seen = new Set();
  return list.filter(m => m.poster_path && !seen.has(m.poster_path) && seen.add(m.poster_path));
};

function buildPlaylists(movies, favorites, collections, currentView) {
  const favSet = new Set(favorites);
  const byGenre = new Map();
  for (const m of movies) for (const g of m.genres || []) {
    const n = genreName(g);
    if (!byGenre.has(n)) byGenre.set(n, []);
    byGenre.get(n).push(m);
  }
  const quick = [
    currentView && { id: 'view', label: 'Current view', icon: Layers, items: uniquePosters(currentView) },
    { id: 'all', label: 'All titles', icon: Film, items: uniquePosters(movies) },
    { id: 'fav', label: 'Favourites', icon: Heart, items: uniquePosters(movies.filter(m => favSet.has(m.id))) },
  ].filter(Boolean);
  const cols = collections.map(c => {
    const ids = new Set(c.movie_ids);
    return { id: 'col:' + c.id, label: c.name, icon: FolderHeart, items: uniquePosters(movies.filter(m => ids.has(m.id))) };
  });
  const genres = [...byGenre.entries()].sort((a, b) => b[1].length - a[1].length)
    .map(([n, items]) => ({ id: 'genre:' + n, label: n, icon: Tag, items: uniquePosters(items) }));
  return { quick, cols, genres };
}

const Chip = ({ p, on, onPick }) => (
  <button type="button" onClick={() => onPick(p.id)} disabled={!p.items.length} aria-pressed={on}
    className={'flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors disabled:opacity-40 ' + (on ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50')}
    data-testid={`lobby-playlist-${p.id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>
    <p.icon className="w-3.5 h-3.5" />{p.label}<span className="opacity-60">{p.items.length.toLocaleString()}</span>
  </button>
);

const Group = ({ title, list, sel, onPick }) => list.length > 0 && (
  <div className="space-y-2">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
    <div className="flex flex-wrap gap-1.5">{list.map(p => <Chip key={p.id} p={p} on={sel === p.id} onPick={onPick} />)}</div>
  </div>
);

export const LobbyPicker = ({ open, onOpenChange, movies, favorites, collections, currentView, onStart }) => {
  const lists = useMemo(() => (open ? buildPlaylists(movies, favorites, collections, currentView) : null), [open, movies, favorites, collections, currentView]);
  const [sel, setSel] = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const [speed, setSpeed] = useState(getSlideshowSpeed);
  if (!lists) return null;
  const all = [...lists.quick, ...lists.cols, ...lists.genres];
  const chosen = all.find(p => p.id === sel) || lists.quick.find(p => p.items.length) || lists.quick[0];
  const start = () => { setSlideshowSpeed(speed); onStart({ movies: chosen.items, shuffle, speed }); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" data-testid="lobby-picker">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tv className="w-5 h-5 text-primary" /> Lobby Mode</DialogTitle>
          <DialogDescription>Pick what tonight's lobby display shows. It plays full screen; press Esc to leave.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          <Group title="Playlist" list={lists.quick} sel={chosen.id} onPick={setSel} />
          <Group title="Collections" list={lists.cols} sel={chosen.id} onPick={setSel} />
          <Group title="Genres" list={lists.genres} sel={chosen.id} onPick={setSel} />
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
          <button type="button" onClick={() => setShuffle(s => !s)} aria-pressed={shuffle}
            className={'flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-medium transition-colors ' + (shuffle ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
            data-testid="lobby-picker-shuffle"><Shuffle className="w-3.5 h-3.5" /> Shuffle</button>
          <div className="flex items-center rounded-full border border-border p-0.5" role="group" aria-label="Seconds per poster">
            {SPEEDS.map(s => (
              <button key={s} type="button" onClick={() => setSpeed(s)} aria-pressed={speed === s}
                className={'h-7 px-3 rounded-full text-xs font-medium transition-colors ' + (speed === s ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                data-testid={`lobby-picker-speed-${s}`}>{s}s</button>
            ))}
          </div>
          <Button className="ml-auto" onClick={start} disabled={!chosen.items.length} data-testid="lobby-picker-start">
            <Tv className="w-4 h-4 mr-2" /> Start · {chosen.items.length.toLocaleString()} posters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
