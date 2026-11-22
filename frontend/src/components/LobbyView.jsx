import { X, Star } from "lucide-react";
import { thumbUrl } from "@/lib/tmdbMatcher";

// Full-screen cinema lobby display: blurred poster backdrop, slow zoom, "Now Showing" banner
export const LobbyView = ({ movie, speed, idle, onWake, onExit }) => {
  const src = thumbUrl(movie.poster_path, 'original');
  const rating = Number(movie.rating);
  return (
    <div className={'oc-lobby fixed inset-0 z-[80] bg-black overflow-hidden flex items-center justify-center' + (idle ? ' cursor-none' : '')}
      onMouseMove={onWake} onClick={(e) => e.stopPropagation()} data-testid="lobby-mode">
      <img key={'bg' + movie.id} src={src} alt="" aria-hidden="true" className="oc-lobby-bg absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      <img key={movie.id} src={src} alt={movie.title} className="oc-lobby-poster relative h-[86vh] max-w-[80vw] object-contain rounded-lg shadow-[0_30px_120px_rgba(0,0,0,0.9)]"
        style={{ animationDuration: `0.9s, ${speed + 1}s` }} data-testid="lobby-poster" />
      <div key={'b' + movie.id} className="oc-lobby-banner absolute bottom-8 left-10 max-w-[40vw]" data-testid="lobby-banner">
        <p className="text-[11px] font-bold tracking-[0.35em] text-primary uppercase">Now Showing</p>
        <p className="text-3xl font-bold font-[Outfit] text-white leading-tight mt-1" data-testid="lobby-title">{movie.title}</p>
        <p className="text-sm text-white/70 mt-1 flex items-center gap-2">
          {movie.year && <span>{movie.year}</span>}
          {rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{rating.toFixed(1)}</span>}
        </p>
      </div>
      <button type="button" onClick={onExit} aria-label="Leave Lobby Mode"
        className={'absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-opacity duration-500' + (idle ? ' opacity-0 pointer-events-none' : '')} data-testid="lobby-exit-btn">
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};
