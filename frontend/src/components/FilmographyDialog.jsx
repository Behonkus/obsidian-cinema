import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { filmography, pairFilmography } from "@/lib/peopleStats";

// person: { name, role: 'actor'|'director', photo } or { actor, director, role: 'pair' }
export const FilmographyDialog = ({ person, movies, onClose }) => {
  const navigate = useNavigate();
  const films = useMemo(() => {
    if (!person) return [];
    return person.role === 'pair' ? pairFilmography(movies, person.actor, person.director) : filmography(movies, person.name, person.role);
  }, [person, movies]);
  if (!person) return null;
  const title = person.role === 'pair' ? person.actor + ' & ' + person.director : person.name;
  const label = person.role === 'director' ? 'Directed' : person.role === 'pair' ? 'Together' : 'Appears in';
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg" data-testid="filmography-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {person.photo
              ? <img src={person.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
              : <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>}
            <div className="min-w-0">
              <DialogTitle className="truncate" data-testid="filmography-name">{title}</DialogTitle>
              <DialogDescription data-testid="filmography-count">{label} {films.length} {films.length === 1 ? 'film' : 'films'} in your library</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1" data-testid="filmography-list">
          {films.map(({ movie, character }, i) => (
            <button
              key={movie.id}
              onClick={() => { onClose(); navigate('/?open=' + encodeURIComponent(movie.id)); }}
              className="w-full flex items-center gap-3 p-1.5 rounded-md text-left hover:bg-secondary/60 transition-colors"
              data-testid={'filmography-item-' + i}
            >
              {movie.poster_path
                ? <img src={movie.poster_path} alt="" className="w-9 h-[54px] rounded object-cover shrink-0" loading="lazy" />
                : <div className="w-9 h-[54px] rounded bg-secondary flex items-center justify-center shrink-0"><Film className="w-4 h-4 text-muted-foreground" /></div>}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{movie.title}</p>
                <p className="text-xs text-muted-foreground truncate">{[movie.year, character && 'as ' + character].filter(Boolean).join(' · ')}</p>
              </div>
              {movie.rating ? <span className="text-xs text-amber-400 shrink-0">★ {movie.rating.toFixed(1)}</span> : null}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
