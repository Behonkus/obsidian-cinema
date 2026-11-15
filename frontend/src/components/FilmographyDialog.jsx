import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Users, Library, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { filmography, pairFilmography, missingFilms } from "@/lib/peopleStats";

const TMDB_KEY = 'obsidian_cinema_tmdb_key';

const Poster = ({ src }) => (src
  ? <img src={src} alt="" className="w-9 h-[54px] rounded object-cover shrink-0" loading="lazy" />
  : <div className="w-9 h-[54px] rounded bg-secondary flex items-center justify-center shrink-0"><Film className="w-4 h-4 text-muted-foreground" /></div>);

const Row = ({ poster, title, sub, rating, onClick, testId, icon }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-1.5 rounded-md text-left hover:bg-secondary/60 transition-colors" data-testid={testId}>
    <Poster src={poster} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground truncate">{sub}</p>
    </div>
    {rating ? <span className="text-xs text-amber-400 shrink-0">★ {rating.toFixed(1)}</span> : null}
    {icon}
  </button>
);

const openTmdb = (id) => {
  const u = 'https://www.themoviedb.org/movie/' + id;
  if (window.electronAPI?.openExternal) window.electronAPI.openExternal(u); else window.open(u, '_blank');
};

// Well-known films not in the library (single person only)
const MissingFilms = ({ person, movies }) => {
  const [state, setState] = useState({ loading: true, films: [] });
  useEffect(() => {
    const key = localStorage.getItem(TMDB_KEY);
    if (!key) { setState({ loading: false, films: [], noKey: true }); return; }
    let alive = true;
    missingFilms(movies, person.name, person.role, key, 8)
      .then(films => { if (alive) setState({ loading: false, films }); })
      .catch(() => { if (alive) setState({ loading: false, films: [] }); });
    return () => { alive = false; };
  }, [person, movies]);
  return (
    <div className="pt-3 border-t border-border/60" data-testid="filmography-missing">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Well-known films not in your library</p>
      {state.loading && <p className="text-xs text-muted-foreground flex items-center gap-1.5" data-testid="filmography-missing-loading"><Loader2 className="w-3 h-3 animate-spin" /> Looking up TMDB…</p>}
      {!state.loading && state.noKey && <p className="text-xs text-muted-foreground">Add your TMDB API key in Settings to see these.</p>}
      {!state.loading && !state.noKey && state.films.length === 0 && <p className="text-xs text-muted-foreground" data-testid="filmography-missing-empty">You have all their well-known films.</p>}
      <div className="space-y-1">
        {state.films.map((f, i) => (
          <Row key={f.id} poster={f.poster} title={f.title} rating={f.rating} onClick={() => openTmdb(f.id)} testId={'filmography-missing-' + i}
            sub={[f.year, f.character && 'as ' + f.character].filter(Boolean).join(' · ')}
            icon={<ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />} />
        ))}
      </div>
    </div>
  );
};

// person: { name, role: 'actor'|'director', photo } or { actor, director, role: 'pair' }
export const FilmographyDialog = ({ person, movies, onClose, onLeave }) => {
  const navigate = useNavigate();
  const films = useMemo(() => {
    if (!person) return [];
    return person.role === 'pair' ? pairFilmography(movies, person.actor, person.director) : filmography(movies, person.name, person.role);
  }, [person, movies]);
  if (!person) return null;
  const title = person.role === 'pair' ? person.actor + ' & ' + person.director : person.name;
  const label = person.role === 'director' ? 'Directed' : person.role === 'pair' ? 'Together' : 'Appears in';
  const showInLibrary = () => {
    const q = person.role === 'pair'
      ? 'person=' + encodeURIComponent(person.actor) + '&role=pair&director=' + encodeURIComponent(person.director)
      : 'person=' + encodeURIComponent(person.name) + '&role=' + person.role;
    onClose();
    if (onLeave) onLeave();
    navigate('/?' + q);
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg" data-testid="filmography-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {person.photo
              ? <img src={person.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
              : <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>}
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate" data-testid="filmography-name">{title}</DialogTitle>
              <DialogDescription data-testid="filmography-count">{label} {films.length} {films.length === 1 ? 'film' : 'films'} in your library</DialogDescription>
            </div>
          </div>
          {films.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs self-start mt-2" onClick={showInLibrary} data-testid="filmography-show-library">
              <Library className="w-3.5 h-3.5 mr-1" /> Show all in Library
            </Button>
          )}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-1 pr-1" data-testid="filmography-list">
          {films.map(({ movie, character }, i) => (
            <Row key={movie.id} poster={movie.poster_path} title={movie.title} rating={movie.rating} testId={'filmography-item-' + i}
              sub={[movie.year, character && 'as ' + character].filter(Boolean).join(' · ')}
              onClick={() => { onClose(); if (onLeave) onLeave(); navigate('/?open=' + encodeURIComponent(movie.id)); }} />
          ))}
          {person.role !== 'pair' && <MissingFilms person={person} movies={movies} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
