import { Play, Pause, Shuffle } from "lucide-react";

const SPEEDS = [4, 6, 10];

export const SlideshowControls = ({ playing, onPlay, shuffle, onShuffle, speed, onSpeed, className = '' }) => (
  <div className={'flex items-center gap-2 rounded-full bg-white/10 border border-white/10 p-1 ' + className} data-testid="slideshow-controls">
    <button type="button" onClick={onPlay} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
      className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-[filter]" data-testid="slideshow-play-btn">
      {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      {playing ? 'Pause' : 'Slideshow'}
    </button>
    <button type="button" onClick={onShuffle} aria-pressed={shuffle} aria-label="Shuffle"
      className={'h-8 w-8 flex items-center justify-center rounded-full transition-colors ' + (shuffle ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10')} data-testid="slideshow-shuffle-btn">
      <Shuffle className="w-3.5 h-3.5" />
    </button>
    <div className="flex items-center" role="group" aria-label="Seconds per poster">
      {SPEEDS.map(s => (
        <button key={s} type="button" onClick={() => onSpeed(s)} aria-pressed={speed === s}
          className={'h-8 px-2.5 rounded-full text-xs font-medium transition-colors ' + (speed === s ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white')} data-testid={`slideshow-speed-${s}`}>
          {s}s
        </button>
      ))}
    </div>
  </div>
);
