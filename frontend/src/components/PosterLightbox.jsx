import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { thumbUrl } from "@/lib/tmdbMatcher";
import { SlideshowControls, getSlideshowSpeed, setSlideshowSpeed } from "@/components/SlideshowControls";
import { LobbyView } from "@/components/LobbyView";

const IDLE_MS = 2500;

const shuffledFrom = (n, first) => {
  const rest = [...Array(n).keys()].filter(k => k !== first);
  for (let k = rest.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [rest[k], rest[j]] = [rest[j], rest[k]]; }
  return [first, ...rest];
};

// Hides controls after a pause in mouse movement while active
function useIdle(active) {
  const [idle, setIdle] = useState(false);
  const t = useRef();
  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(t.current);
    if (active) t.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, [active]);
  useEffect(() => { wake(); return () => clearTimeout(t.current); }, [wake]);
  return [idle, wake];
}

// Full-size poster viewer; arrows flip through the titles currently shown, play runs a lobby-style slideshow
export const PosterLightbox = ({ movies, startMovie, onClose, onLobby, autoLobby = false, initialShuffle = false, initialSpeed }) => {
  const list = useMemo(() => {
    const withPosters = movies.filter(m => m.poster_path);
    return withPosters.some(m => m.id === startMovie.id) ? withPosters : [startMovie];
  }, [movies, startMovie]);
  const start = Math.max(0, list.findIndex(m => m.id === startMovie.id));
  const [order, setOrder] = useState(() => (initialShuffle ? shuffledFrom(list.length, Math.floor(Math.random() * list.length)) : [...Array(list.length).keys()]));
  const [pos, setPos] = useState(initialShuffle ? 0 : start);
  const [playing, setPlaying] = useState(autoLobby);
  const [shuffle, setShuffle] = useState(initialShuffle);
  const [speed, setSpeed] = useState(() => initialSpeed || getSlideshowSpeed());
  const [lobby, setLobby] = useState(autoLobby);
  const [idle, wake] = useIdle(playing);
  const m = list[order[pos]];
  const many = list.length > 1;
  const go = useCallback((d) => setPos(v => (v + d + order.length) % order.length), [order.length]);

  const toggleShuffle = () => {
    const cur = order[pos];
    setOrder(shuffle ? [...Array(list.length).keys()] : shuffledFrom(list.length, cur));
    setPos(shuffle ? cur : 0);
    setShuffle(!shuffle);
  };
  const enterLobby = () => {
    setLobby(true); setPlaying(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const exitLobby = useCallback(() => {
    setLobby(false); setPlaying(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    if (autoLobby) onClose();
  }, [autoLobby, onClose]);

  useEffect(() => {
    if (autoLobby) document.documentElement.requestFullscreen?.().catch(() => {});
  }, [autoLobby]);

  useEffect(() => {
    if (!lobby) return undefined;
    const onFs = () => { if (!document.fullscreenElement) exitLobby(); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [lobby, exitLobby]);

  const pickSpeed = (s) => { setSpeed(s); setSlideshowSpeed(s); };

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => go(1), speed * 1000);
    return () => clearTimeout(t);
  }, [playing, pos, speed, go]);

  useEffect(() => {
    const next = list[order[(pos + 1) % order.length]];
    if (next) new Image().src = thumbUrl(next.poster_path, 'original');
  }, [pos, order, list]);

  useEffect(() => {
    const onKey = (e) => {
      wake();
      if (e.key === 'Escape') { e.stopPropagation(); if (lobby) exitLobby(); else onClose(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ' && many) { e.preventDefault(); setPlaying(p => !p); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, many, onClose, wake, lobby, exitLobby]);

  const hide = idle ? ' opacity-0 pointer-events-none' : ' opacity-100';
  return createPortal(
    <div role="dialog" data-state="open" aria-label="Enlarged poster" onMouseMove={wake}
      className={'oc-lightbox fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6' + (idle ? ' cursor-none' : '')}
      onClick={onClose} data-testid="poster-lightbox" data-playing={playing}>
      <button type="button" onClick={onClose} className={'absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-opacity duration-500' + hide} aria-label="Close" data-testid="poster-lightbox-close">
        <X className="w-6 h-6 text-white" />
      </button>
      {many && <NavButton side="left" onClick={() => go(-1)} hide={hide} />}
      <figure className="flex flex-col items-center gap-4 max-h-full" onClick={(e) => e.stopPropagation()}>
        <img key={m.id} src={thumbUrl(m.poster_path, 'original')} alt={m.title} className={'oc-lightbox-img rounded-xl shadow-2xl object-contain max-h-[72vh] max-w-[80vw]'} data-testid="poster-lightbox-img" />
        <figcaption className={'text-center transition-opacity duration-500' + hide}>
          <p className="text-xl font-bold font-[Outfit] text-white" data-testid="poster-lightbox-title">{m.title}{m.year ? <span className="text-white/60 font-normal"> ({m.year})</span> : null}</p>
          {many && <p className="text-xs text-white/50 mt-1" data-testid="poster-lightbox-count">{(pos + 1).toLocaleString()} of {list.length.toLocaleString()} · ← → to flip · Space to play</p>}
        </figcaption>
        {many && (
          <SlideshowControls className={'transition-opacity duration-500' + hide} playing={playing} onPlay={() => setPlaying(p => !p)}
            shuffle={shuffle} onShuffle={toggleShuffle} speed={speed} onSpeed={pickSpeed} onLobby={onLobby || enterLobby} />
        )}
      </figure>
      {many && <NavButton side="right" onClick={() => go(1)} hide={hide} />}
      {lobby && <LobbyView movie={m} speed={speed} idle={idle} onWake={wake} onExit={exitLobby} />}
    </div>,
    document.body
  );
};

const NavButton = ({ side, onClick, hide }) => {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={'absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 transition-opacity duration-500 ' + (side === 'left' ? 'left-5' : 'right-5') + hide}
      aria-label={side === 'left' ? 'Previous poster' : 'Next poster'} data-testid={`poster-lightbox-${side === 'left' ? 'prev' : 'next'}`}>
      <Icon className="w-7 h-7 text-white" />
    </button>
  );
};
