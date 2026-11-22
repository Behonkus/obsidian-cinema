import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { thumbUrl } from "@/lib/tmdbMatcher";

// Full-size poster viewer; arrows flip through the titles currently shown in the library
export const PosterLightbox = ({ movies, startMovie, onClose }) => {
  const list = useMemo(() => {
    const withPosters = movies.filter(m => m.poster_path);
    return withPosters.some(m => m.id === startMovie.id) ? withPosters : [startMovie];
  }, [movies, startMovie]);
  const [i, setI] = useState(() => Math.max(0, list.findIndex(m => m.id === startMovie.id)));
  const m = list[i];
  const many = list.length > 1;
  const go = (d) => setI(v => (v + d + list.length) % list.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div role="dialog" data-state="open" aria-label="Enlarged poster" className="oc-lightbox fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose} data-testid="poster-lightbox">
      <button type="button" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close" data-testid="poster-lightbox-close">
        <X className="w-6 h-6 text-white" />
      </button>
      {many && <NavButton side="left" onClick={() => go(-1)} />}
      <figure className="flex flex-col items-center gap-4 max-h-full" onClick={(e) => e.stopPropagation()}>
        <img key={m.id} src={thumbUrl(m.poster_path, 'original')} alt={m.title} className="oc-lightbox-img max-h-[78vh] max-w-[80vw] rounded-xl shadow-2xl object-contain" data-testid="poster-lightbox-img" />
        <figcaption className="text-center">
          <p className="text-xl font-bold font-[Outfit] text-white" data-testid="poster-lightbox-title">{m.title}{m.year ? <span className="text-white/60 font-normal"> ({m.year})</span> : null}</p>
          {many && <p className="text-xs text-white/50 mt-1" data-testid="poster-lightbox-count">{(i + 1).toLocaleString()} of {list.length.toLocaleString()} · use ← → to flip</p>}
        </figcaption>
      </figure>
      {many && <NavButton side="right" onClick={() => go(1)} />}
    </div>,
    document.body
  );
};

const NavButton = ({ side, onClick }) => {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={'absolute top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 transition-colors ' + (side === 'left' ? 'left-5' : 'right-5')}
      aria-label={side === 'left' ? 'Previous poster' : 'Next poster'} data-testid={`poster-lightbox-${side === 'left' ? 'prev' : 'next'}`}>
      <Icon className="w-7 h-7 text-white" />
    </button>
  );
};
