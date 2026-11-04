import { useState, useMemo } from "react";
import { Layers, Play, Scissors, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { partsOf, partLabel, isMultiPart } from "@/lib/multiPart";

// Pick which part to play
export function PartsPlayDialog({ movie, onClose, onPlayPart }) {
  return (
    <Dialog open={!!movie} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md" data-testid="parts-play-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />{movie?.title}</DialogTitle>
          <DialogDescription>Choose a part to play</DialogDescription>
        </DialogHeader>
        {movie && <PartsList movie={movie} onPlayPart={(p) => { onPlayPart(movie, p); onClose(); }} />}
      </DialogContent>
    </Dialog>
  );
}

// List of parts with play buttons (used in the play picker and the movie details)
export function PartsList({ movie, onPlayPart, onSplit }) {
  const parts = partsOf(movie);
  return (
    <div className="space-y-1.5" data-testid="parts-list">
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {parts.map((p, i) => (
          <div key={p.file_path} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 hover:bg-secondary/70 transition-colors">
            <span className="text-xs font-semibold text-primary w-16 shrink-0">{partLabel(p, i)}</span>
            <span className="text-xs text-muted-foreground truncate flex-1" title={p.file_path}>{p.file_name}</span>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onPlayPart(p)} data-testid={`play-part-${i}`}>
              <Play className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {onSplit && (
        <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={onSplit} data-testid="split-parts-btn">
          <Scissors className="w-3 h-3 mr-1.5" /> Split into separate cards
        </Button>
      )}
    </div>
  );
}

function SuggestionGroup({ group, checked, onToggle, onDismiss }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-secondary/20" data-testid={`multipart-group-${group.key}`}>
      <div className="flex items-center gap-2">
        <Checkbox checked={checked} onCheckedChange={onToggle} data-testid="multipart-group-checkbox" />
        <span className="text-sm font-medium flex-1 truncate">{group.title}</span>
        <span className="text-[10px] text-muted-foreground">{group.members.length} parts</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={onDismiss} data-testid="multipart-dismiss-btn">Not multi-part</Button>
      </div>
      <div className="mt-1.5 pl-6 space-y-0.5">
        {group.members.map(m => (
          <p key={m.id} className="text-[11px] text-muted-foreground truncate" title={m.file_path}>{m.file_name}</p>
        ))}
      </div>
    </div>
  );
}

// Auto-detected groups for the user to approve
export function MultiPartSuggestDialog({ open, onOpenChange, groups, onMerge, onDismiss }) {
  const [unchecked, setUnchecked] = useState({});
  const selected = groups.filter(g => !unchecked[g.key]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="multipart-suggest-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Multi-Part Titles Found</DialogTitle>
          <DialogDescription>
            These files look like parts of the same title (same folder, numbered Part / CD / Episode). Merged parts share one card and count as one movie. No files are moved or changed, and you can split them again anytime.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {groups.map(g => (
            <SuggestionGroup key={g.key} group={g} checked={!unchecked[g.key]}
              onToggle={() => setUnchecked(u => ({ ...u, [g.key]: !u[g.key] }))}
              onDismiss={() => onDismiss(g)} />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={selected.length === 0} onClick={() => onMerge(selected)} data-testid="multipart-merge-selected-btn">
            Merge {selected.length} {selected.length === 1 ? 'title' : 'titles'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Manually choose other cards to merge into the current one
export function MergePickerDialog({ movie, movies, onClose, onMerge }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState({});
  const results = useMemo(() => {
    if (!movie) return [];
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return movies.filter(m => m.id !== movie.id && ((m.title || '').toLowerCase().includes(q) || (m.file_name || '').toLowerCase().includes(q))).slice(0, 50);
  }, [movie, movies, query]);
  const pickedIds = Object.keys(picked).filter(k => picked[k]);
  return (
    <Dialog open={!!movie} onOpenChange={(o) => { if (!o) { onClose(); setPicked({}); setQuery(''); } }}>
      <DialogContent className="max-w-lg" data-testid="merge-picker-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Merge parts into "{movie?.title}"</DialogTitle>
          <DialogDescription>Search for the other parts and tick them. They will become parts of this card.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a title or file name..." className="pl-8" data-testid="merge-picker-search" />
          {query && <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setQuery('')}><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {results.map(m => (
            <label key={m.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer" data-testid={`merge-pick-${m.id}`}>
              <Checkbox checked={!!picked[m.id]} onCheckedChange={() => setPicked(p => ({ ...p, [m.id]: !p[m.id] }))} />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{m.title}{m.year ? ' (' + m.year + ')' : ''}{isMultiPart(m) ? ' — ' + m.parts.length + ' parts' : ''}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.file_name}</p>
              </div>
            </label>
          ))}
          {query.trim().length >= 2 && results.length === 0 && <p className="text-xs text-muted-foreground p-2">No matching cards</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setPicked({}); setQuery(''); }}>Cancel</Button>
          <Button disabled={pickedIds.length === 0} onClick={() => { onMerge(movie, pickedIds); setPicked({}); setQuery(''); }} data-testid="merge-picker-confirm-btn">
            Merge {pickedIds.length > 0 ? pickedIds.length + ' ' : ''}into this card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
