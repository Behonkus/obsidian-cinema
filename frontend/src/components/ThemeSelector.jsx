import { useState, useEffect } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

var STORAGE_KEY = 'obsidian_cinema_theme';

var THEMES = [
  { id: 'crimson',    name: 'Crimson',        hue: '347 77% 50%',  preview: '#e11d48' },
  { id: 'blue',       name: 'Ocean Blue',     hue: '217 91% 60%',  preview: '#3b82f6' },
  { id: 'emerald',    name: 'Emerald',        hue: '160 84% 39%',  preview: '#10b981' },
  { id: 'violet',     name: 'Violet',         hue: '263 70% 58%',  preview: '#8b5cf6' },
  { id: 'amber',      name: 'Amber',          hue: '38 92% 50%',   preview: '#f59e0b' },
  { id: 'cyan',       name: 'Cyan',           hue: '189 94% 43%',  preview: '#06b6d4' },
  { id: 'rose',       name: 'Rose',           hue: '330 81% 60%',  preview: '#f43f5e' },
  { id: 'lime',       name: 'Lime',           hue: '84 81% 44%',   preview: '#84cc16' },
  { id: 'orange',     name: 'Sunset Orange',  hue: '25 95% 53%',   preview: '#f97316' },
  { id: 'teal',       name: 'Teal',           hue: '173 80% 36%',  preview: '#14b8a6' },
  { id: 'pink',       name: 'Bubblegum',      hue: '316 72% 55%',  preview: '#d946ef' },
  { id: 'sky',        name: 'Sky',            hue: '199 89% 48%',  preview: '#0ea5e9' },
  { id: 'pastel-pink',    name: 'Pastel Rose',     hue: '340 60% 70%',  preview: '#dfa3b3' },
  { id: 'pastel-blue',    name: 'Pastel Blue',     hue: '210 60% 70%',  preview: '#99b8db' },
  { id: 'pastel-green',   name: 'Pastel Mint',     hue: '150 45% 65%',  preview: '#7cc9a8' },
  { id: 'pastel-lavender',name: 'Pastel Lavender', hue: '270 50% 72%',  preview: '#b8a3d9' },
  { id: 'pastel-peach',   name: 'Pastel Peach',    hue: '20 70% 72%',   preview: '#e8b89d' },
  { id: 'rainbow',    name: 'Rainbow',        hue: 'rainbow',      preview: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #8b5cf6)' },
];

function applyTheme(themeId) {
  var theme = THEMES.find(function(t) { return t.id === themeId; });
  if (!theme) return;

  var root = document.documentElement;

  if (theme.hue === 'rainbow') {
    // Rainbow: cycle hue with CSS animation
    root.style.setProperty('--primary', '0 80% 55%');
    root.style.setProperty('--accent', '0 80% 55%');
    root.style.setProperty('--ring', '0 80% 55%');

    // Add rainbow animation if not present
    if (!document.getElementById('rainbow-style')) {
      var style = document.createElement('style');
      style.id = 'rainbow-style';
      style.textContent = [
        '@keyframes rainbowHue { 0% { --primary: 0 80% 55%; --accent: 0 80% 55%; --ring: 0 80% 55%; }',
        '16% { --primary: 30 90% 55%; --accent: 30 90% 55%; --ring: 30 90% 55%; }',
        '33% { --primary: 60 85% 50%; --accent: 60 85% 50%; --ring: 60 85% 50%; }',
        '50% { --primary: 150 80% 45%; --accent: 150 80% 45%; --ring: 150 80% 45%; }',
        '66% { --primary: 217 91% 60%; --accent: 217 91% 60%; --ring: 217 91% 60%; }',
        '83% { --primary: 270 75% 58%; --accent: 270 75% 58%; --ring: 270 75% 58%; }',
        '100% { --primary: 0 80% 55%; --accent: 0 80% 55%; --ring: 0 80% 55%; } }',
        ':root { animation: rainbowHue 12s linear infinite; }'
      ].join(' ');
      document.head.appendChild(style);
    }
  } else {
    // Remove rainbow animation if present
    var rainbowEl = document.getElementById('rainbow-style');
    if (rainbowEl) rainbowEl.remove();

    root.style.setProperty('--primary', theme.hue);
    root.style.setProperty('--accent', theme.hue);
    root.style.setProperty('--ring', theme.hue);
  }
}

// Initialize theme on page load
function initTheme() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    applyTheme(saved);
  }
}

export { THEMES, applyTheme, initTheme, STORAGE_KEY as THEME_STORAGE_KEY };

export default function ThemeSelector() {
  var [current, setCurrent] = useState(function() {
    return localStorage.getItem(STORAGE_KEY) || 'crimson';
  });

  useEffect(function() {
    applyTheme(current);
  }, [current]);

  var selectTheme = function(id) {
    setCurrent(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyTheme(id);
  };

  var currentTheme = THEMES.find(function(t) { return t.id === current; });

  var solidThemes = THEMES.filter(function(t) { return !t.id.startsWith('pastel') && t.id !== 'rainbow'; });
  var pastelThemes = THEMES.filter(function(t) { return t.id.startsWith('pastel'); });
  var specialThemes = THEMES.filter(function(t) { return t.id === 'rainbow'; });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="theme-selector">
          <div
            className="w-4 h-4 rounded-full border border-border"
            style={{ background: currentTheme ? currentTheme.preview : '#e11d48' }}
          />
          <Palette className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="text-xs">Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Solid Colors */}
        <p className="text-[10px] text-muted-foreground px-2 pt-1">Solid</p>
        <div className="grid grid-cols-6 gap-1.5 p-2">
          {solidThemes.map(function(theme) {
            var isActive = current === theme.id;
            return (
              <button
                key={theme.id}
                onClick={function() { selectTheme(theme.id); }}
                className={'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ' + (isActive ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                style={{ background: theme.preview }}
                title={theme.name}
                data-testid={'theme-' + theme.id}
              >
                {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>

        {/* Pastels */}
        <p className="text-[10px] text-muted-foreground px-2 pt-1">Pastel</p>
        <div className="grid grid-cols-6 gap-1.5 p-2">
          {pastelThemes.map(function(theme) {
            var isActive = current === theme.id;
            return (
              <button
                key={theme.id}
                onClick={function() { selectTheme(theme.id); }}
                className={'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ' + (isActive ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')}
                style={{ background: theme.preview }}
                title={theme.name}
                data-testid={'theme-' + theme.id}
              >
                {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>

        {/* Special */}
        <p className="text-[10px] text-muted-foreground px-2 pt-1">Special</p>
        <div className="p-2">
          {specialThemes.map(function(theme) {
            var isActive = current === theme.id;
            return (
              <button
                key={theme.id}
                onClick={function() { selectTheme(theme.id); }}
                className={'w-full h-8 rounded-full border-2 transition-all flex items-center justify-center gap-2 text-xs font-medium text-white ' + (isActive ? 'border-foreground' : 'border-transparent hover:scale-[1.02]')}
                style={{ background: theme.preview }}
                title={theme.name}
                data-testid={'theme-' + theme.id}
              >
                {isActive && <Check className="w-3.5 h-3.5 drop-shadow-md" />}
                {theme.name}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
