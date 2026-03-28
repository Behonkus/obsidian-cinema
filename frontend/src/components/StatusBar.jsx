import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Filter,
  ArrowUpDown,
  Grid3X3,
  Palette,
  Check,
  Wifi,
  WifiOff,
  Monitor,
  Quote,
} from "lucide-react";
import { THEMES, applyTheme, THEME_STORAGE_KEY } from "@/components/ThemeSelector";
import DailyQuote from "@/components/DailyQuote";

var SORT_LABELS = {
  'title-asc': 'A→Z', 'title-desc': 'Z→A',
  'year-desc': 'Newest', 'year-asc': 'Oldest',
  'rating-desc': 'Top Rated', 'rating-asc': 'Low Rated',
  'added-desc': 'Recent', 'added-asc': 'First Added',
  'directory': 'Directory', 'filename-asc': 'File A→Z',
  'filename-desc': 'File Z→A', 'has-poster': 'Has Poster',
  'no-poster': 'No Poster',
};

var QF_LABELS = {
  'no-poster': 'No Poster', 'no-rating': 'No Rating',
  'no-year': 'No Year', 'favorites': 'Favorites',
  'recent': 'Recently Added',
};

export default function StatusBar({ sidebarCollapsed }) {
  var [sortBy, setSortBy] = useState('');
  var [gridSize, setGridSize] = useState('medium');
  var [currentTheme, setCurrentTheme] = useState('rose');
  var [customColor, setCustomColor] = useState('#e11d48');
  var [online, setOnline] = useState(navigator.onLine);
  var [showThemePicker, setShowThemePicker] = useState(false);
  var [quickFilter, setQuickFilter] = useState('');
  var [movieCount, setMovieCount] = useState(0);
  var location = useLocation();

  useEffect(function() {
    var loadState = function() {
      setSortBy(localStorage.getItem('obsidian_cinema_sort_by') || 'title-asc');
      setGridSize(localStorage.getItem('obsidian_cinema_grid_size') || 'medium');
      setCurrentTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'rose');
      setCustomColor(localStorage.getItem('obsidian_cinema_custom_color') || '#e11d48');
      var raw = localStorage.getItem('obsidian_cinema_local_movies');
      setMovieCount(raw ? JSON.parse(raw).length : 0);
      var params = new URLSearchParams(window.location.search);
      setQuickFilter(params.get('qf') || '');
    };
    loadState();
    var interval = setInterval(loadState, 3000);
    return function() { clearInterval(interval); };
  }, [location]);

  useEffect(function() {
    var goOnline = function() { setOnline(true); };
    var goOffline = function() { setOnline(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return function() {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  var cycleGridSize = function() {
    var sizes = ['small', 'medium', 'large'];
    var idx = sizes.indexOf(gridSize);
    var next = sizes[(idx + 1) % sizes.length];
    setGridSize(next);
    localStorage.setItem('obsidian_cinema_grid_size', next);
    window.dispatchEvent(new Event('storage'));
  };

  var solidThemes = THEMES.filter(function(t) { return !t.id.startsWith('pastel') && t.id !== 'rainbow'; });

  var version = '1.3.6';

  return (
    <div
      className="fixed bottom-0 right-0 h-7 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center justify-between px-3 z-40 text-[11px]"
      style={{ left: sidebarCollapsed ? 80 : 256, transition: 'left 0.3s ease-in-out' }}
      data-testid="status-bar"
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Online/Offline */}
        <div className="flex items-center gap-1" title={online ? "Online — TMDB available" : "Offline — TMDB unavailable"}>
          {online ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
        </div>

        <div className="w-px h-3.5 bg-border/40" />

        {/* Active sort */}
        <div className="flex items-center gap-1 text-muted-foreground" title={"Sort: " + (SORT_LABELS[sortBy] || 'A→Z')}>
          <ArrowUpDown className="w-3 h-3" />
          <span>{SORT_LABELS[sortBy] || 'A→Z'}</span>
        </div>

        {/* Active filter */}
        {quickFilter && (
          <>
            <div className="w-px h-3.5 bg-border/40" />
            <div className="flex items-center gap-1 text-primary" title={"Filter: " + (QF_LABELS[quickFilter] || quickFilter)}>
              <Filter className="w-3 h-3" />
              <span>{QF_LABELS[quickFilter] || quickFilter}</span>
            </div>
          </>
        )}

        <div className="w-px h-3.5 bg-border/40" />

        {/* Movie count */}
        <span className="text-muted-foreground" title="Total movies in library">
          {movieCount.toLocaleString()} movies
        </span>
      </div>

      {/* Center — Daily Quote */}
      <div className="hidden lg:flex flex-1 justify-center px-6 overflow-hidden">
        <div className="max-w-md truncate">
          <DailyQuote />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Grid size toggle */}
        <button
          onClick={cycleGridSize}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          title={"Poster size: " + gridSize.charAt(0).toUpperCase() + gridSize.slice(1) + " (click to cycle)"}
          data-testid="statusbar-grid-toggle"
        >
          <Grid3X3 className="w-3 h-3" />
          <span>{gridSize === 'small' ? 'S' : gridSize === 'medium' ? 'M' : 'L'}</span>
        </button>

        <div className="w-px h-3.5 bg-border/40" />

        {/* Theme quick-switch */}
        <div className="relative">
          <button
            onClick={function() { setShowThemePicker(!showThemePicker); }}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Quick theme switch"
            data-testid="statusbar-theme-toggle"
          >
            <Palette className="w-3 h-3" />
            <div
              className="w-3 h-3 rounded-full border border-border/50"
              style={{ background: currentTheme === 'custom' ? customColor : (THEMES.find(function(t) { return t.id === currentTheme; }) || {}).preview || '#e11d48' }}
            />
          </button>

          {showThemePicker && (
            <div
              className="absolute bottom-7 right-0 p-2 rounded-lg bg-popover border border-border shadow-xl z-50 flex flex-wrap gap-1.5 max-w-[180px]"
              onMouseLeave={function() { setShowThemePicker(false); }}
              data-testid="statusbar-theme-picker"
            >
              {solidThemes.map(function(theme) {
                var active = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={function() {
                      setCurrentTheme(theme.id);
                      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
                      applyTheme(theme.id);
                      setShowThemePicker(false);
                    }}
                    className={'w-5 h-5 rounded-full border transition-all flex items-center justify-center ' + (active ? 'border-foreground scale-110' : 'border-transparent hover:scale-110')}
                    style={{ background: theme.preview }}
                    title={theme.name}
                  >
                    {active && <Check className="w-2.5 h-2.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-3.5 bg-border/40" />

        {/* Version */}
        <div className="flex items-center gap-1 text-muted-foreground/60" title="Obsidian Cinema version">
          <Monitor className="w-3 h-3" />
          <span>v{version}</span>
        </div>
      </div>
    </div>
  );
}
