import { useState, useEffect } from "react";

/* ── Animated Popcorn (for empty states) ── */
export function PopcornAnimation({ size = "lg" }) {
  var s = size === "lg" ? "w-20 h-20" : "w-12 h-12";
  return (
    <div className={"popcorn-container " + s} data-testid="popcorn-animation">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Bucket */}
        <polygon points="30,55 70,55 65,90 35,90" fill="#e11d48" stroke="#be123c" strokeWidth="1.5" />
        <polygon points="28,50 72,50 70,58 30,58" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
        {/* Stripes */}
        <line x1="40" y1="55" x2="38" y2="90" stroke="#be123c" strokeWidth="1" opacity="0.4" />
        <line x1="50" y1="55" x2="50" y2="90" stroke="#be123c" strokeWidth="1" opacity="0.4" />
        <line x1="60" y1="55" x2="62" y2="90" stroke="#be123c" strokeWidth="1" opacity="0.4" />
        {/* Popcorn kernels bouncing */}
        <circle cx="42" cy="42" r="7" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" className="popcorn-kernel-1" />
        <circle cx="58" cy="40" r="8" fill="#fef9c3" stroke="#facc15" strokeWidth="1" className="popcorn-kernel-2" />
        <circle cx="50" cy="35" r="7" fill="#fefce8" stroke="#fbbf24" strokeWidth="1" className="popcorn-kernel-3" />
        <circle cx="36" cy="46" r="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" className="popcorn-kernel-4" />
        <circle cx="64" cy="46" r="6" fill="#fef9c3" stroke="#fbbf24" strokeWidth="1" className="popcorn-kernel-5" />
        <circle cx="45" cy="30" r="5" fill="#fefce8" stroke="#facc15" strokeWidth="1" className="popcorn-kernel-6" />
        <circle cx="55" cy="28" r="5" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" className="popcorn-kernel-7" />
      </svg>
    </div>
  );
}

/* ── Animated Clapperboard (for loading states) ── */
export function ClapperAnimation({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-3" data-testid="clapper-animation">
      <div className="clapper-container w-16 h-16">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Board */}
          <rect x="15" y="40" width="70" height="45" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Text lines on board */}
          <line x1="22" y1="52" x2="55" y2="52" stroke="#64748b" strokeWidth="2" />
          <line x1="22" y1="60" x2="45" y2="60" stroke="#64748b" strokeWidth="2" />
          <line x1="22" y1="68" x2="60" y2="68" stroke="#64748b" strokeWidth="2" />
          <line x1="22" y1="76" x2="40" y2="76" stroke="#64748b" strokeWidth="2" />
          {/* Clapper top (animated) */}
          <g className="clapper-top">
            <rect x="15" y="30" width="70" height="14" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
            {/* Diagonal stripes */}
            <line x1="20" y1="30" x2="28" y2="44" stroke="#fbbf24" strokeWidth="3" />
            <line x1="35" y1="30" x2="43" y2="44" stroke="#fbbf24" strokeWidth="3" />
            <line x1="50" y1="30" x2="58" y2="44" stroke="#fbbf24" strokeWidth="3" />
            <line x1="65" y1="30" x2="73" y2="44" stroke="#fbbf24" strokeWidth="3" />
          </g>
        </svg>
      </div>
      <span className="text-xs text-muted-foreground animate-pulse">{text}</span>
    </div>
  );
}

/* ── Fireworks (for milestones) ── */
export function FireworksOverlay({ onComplete }) {
  useEffect(function() {
    var timer = setTimeout(function() {
      if (onComplete) onComplete();
    }, 3000);
    return function() { clearTimeout(timer); };
  }, [onComplete]);

  return (
    <div className="fireworks-overlay" data-testid="fireworks-overlay">
      <div className="firework firework-1" />
      <div className="firework firework-2" />
      <div className="firework firework-3" />
      <div className="firework firework-4" />
      <div className="firework firework-5" />
    </div>
  );
}

/* ── Sparkle burst (for theme switch, poster fetch, etc.) ── */
export function SparkleBurst({ x, y, onComplete }) {
  useEffect(function() {
    var timer = setTimeout(function() {
      if (onComplete) onComplete();
    }, 900);
    return function() { clearTimeout(timer); };
  }, [onComplete]);

  return (
    <div className="sparkle-burst" style={{ left: x, top: y }} data-testid="sparkle-burst">
      <span /><span /><span /><span /><span /><span />
    </div>
  );
}

/* ── Milestone detector hook ── */
var MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
var MILESTONE_KEY = 'obsidian_cinema_last_milestone';

export function useMilestone(movieCount) {
  var [milestone, setMilestone] = useState(null);

  useEffect(function() {
    if (!movieCount) return;
    var lastSeen = parseInt(localStorage.getItem(MILESTONE_KEY) || '0', 10);
    for (var i = MILESTONES.length - 1; i >= 0; i--) {
      if (movieCount >= MILESTONES[i] && MILESTONES[i] > lastSeen) {
        setMilestone(MILESTONES[i]);
        localStorage.setItem(MILESTONE_KEY, String(MILESTONES[i]));
        break;
      }
    }
  }, [movieCount]);

  var dismiss = function() { setMilestone(null); };
  return [milestone, dismiss];
}
