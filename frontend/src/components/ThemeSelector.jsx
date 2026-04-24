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
  { id: 'disco',      name: 'Disco',          hue: 'disco',        preview: 'linear-gradient(90deg, #ff0080, #ffff00, #00ff80, #ff00ff, #00ffff, #ff0080)' },
  { id: 'icecream',   name: 'Ice Cream',      hue: 'icecream',     preview: 'linear-gradient(90deg, #fbb6ce, #c4b5fd, #a7f3d0, #fde68a, #fbcfe8)' },
];

function hexToHsl(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return Math.round(h * 360) + ' ' + Math.round(s * 100) + '% ' + Math.round(l * 100) + '%';
}

function applyTheme(themeId) {
  var theme = THEMES.find(function(t) { return t.id === themeId; });

  // Handle custom theme
  if (themeId === 'custom') {
    var rainbowEl = document.getElementById('rainbow-style');
    if (rainbowEl) rainbowEl.remove();
    var customHex = localStorage.getItem('obsidian_cinema_custom_color') || '#e11d48';
    var hsl = hexToHsl(customHex);
    var root = document.documentElement;
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--accent', hsl);
    root.style.setProperty('--ring', hsl);
    return;
  }

  if (!theme) return;

  var root = document.documentElement;

  if (theme.hue === 'rainbow' || theme.hue === 'disco' || theme.hue === 'icecream') {
    // Animated themes: cycle hue with CSS animation
    root.style.setProperty('--primary', '0 80% 55%');
    root.style.setProperty('--accent', '0 80% 55%');
    root.style.setProperty('--ring', '0 80% 55%');

    // Remove any existing animated theme style
    var existingStyle = document.getElementById('animated-theme-style');
    if (existingStyle) existingStyle.remove();

    var style = document.createElement('style');
    style.id = 'animated-theme-style';

    if (theme.hue === 'rainbow') {
      style.textContent = [
        '@keyframes themeHue { 0% { --primary: 0 80% 55%; --accent: 0 80% 55%; --ring: 0 80% 55%; }',
        '16% { --primary: 30 90% 55%; --accent: 30 90% 55%; --ring: 30 90% 55%; }',
        '33% { --primary: 60 85% 50%; --accent: 60 85% 50%; --ring: 60 85% 50%; }',
        '50% { --primary: 150 80% 45%; --accent: 150 80% 45%; --ring: 150 80% 45%; }',
        '66% { --primary: 217 91% 60%; --accent: 217 91% 60%; --ring: 217 91% 60%; }',
        '83% { --primary: 270 75% 58%; --accent: 270 75% 58%; --ring: 270 75% 58%; }',
        '100% { --primary: 0 80% 55%; --accent: 0 80% 55%; --ring: 0 80% 55%; } }',
        ':root { animation: themeHue 12s linear infinite; }'
      ].join(' ');
    } else if (theme.hue === 'disco') {
      style.textContent = [
        '@keyframes themeHue {',
        '0% { --primary: 330 100% 50%; --accent: 330 100% 50%; --ring: 330 100% 50%; }',
        '8% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '12% { --primary: 60 100% 50%; --accent: 60 100% 50%; --ring: 60 100% 50%; }',
        '20% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '24% { --primary: 150 100% 50%; --accent: 150 100% 50%; --ring: 150 100% 50%; }',
        '32% { --primary: 280 100% 60%; --accent: 280 100% 60%; --ring: 280 100% 60%; }',
        '36% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '40% { --primary: 190 100% 50%; --accent: 190 100% 50%; --ring: 190 100% 50%; }',
        '48% { --primary: 0 100% 50%; --accent: 0 100% 50%; --ring: 0 100% 50%; }',
        '52% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '56% { --primary: 45 100% 50%; --accent: 45 100% 50%; --ring: 45 100% 50%; }',
        '64% { --primary: 210 100% 55%; --accent: 210 100% 55%; --ring: 210 100% 55%; }',
        '68% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '72% { --primary: 300 100% 55%; --accent: 300 100% 55%; --ring: 300 100% 55%; }',
        '80% { --primary: 120 100% 45%; --accent: 120 100% 45%; --ring: 120 100% 45%; }',
        '84% { --primary: 0 0% 95%; --accent: 0 0% 95%; --ring: 0 0% 95%; }',
        '88% { --primary: 15 100% 55%; --accent: 15 100% 55%; --ring: 15 100% 55%; }',
        '96% { --primary: 260 100% 60%; --accent: 260 100% 60%; --ring: 260 100% 60%; }',
        '100% { --primary: 330 100% 50%; --accent: 330 100% 50%; --ring: 330 100% 50%; } }',
        ':root { animation: themeHue 3s linear infinite; }'
      ].join(' ');
    } else if (theme.hue === 'icecream') {
      style.textContent = [
        '@keyframes themeHue {',
        '0% { --primary: 340 60% 75%; --accent: 340 60% 75%; --ring: 340 60% 75%; }',
        '16% { --primary: 270 55% 75%; --accent: 270 55% 75%; --ring: 270 55% 75%; }',
        '33% { --primary: 150 45% 72%; --accent: 150 45% 72%; --ring: 150 45% 72%; }',
        '50% { --primary: 45 70% 75%; --accent: 45 70% 75%; --ring: 45 70% 75%; }',
        '66% { --primary: 200 60% 75%; --accent: 200 60% 75%; --ring: 200 60% 75%; }',
        '83% { --primary: 310 55% 75%; --accent: 310 55% 75%; --ring: 310 55% 75%; }',
        '100% { --primary: 340 60% 75%; --accent: 340 60% 75%; --ring: 340 60% 75%; } }',
        ':root { animation: themeHue 20s ease-in-out infinite; }'
      ].join(' ');
    }

    document.head.appendChild(style);
  } else {
    // Remove animated theme style if present
    var existingStyle = document.getElementById('animated-theme-style');
    if (existingStyle) existingStyle.remove();
    // Also clean up legacy rainbow-style element
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

export { THEMES, applyTheme, initTheme, hexToHsl, STORAGE_KEY as THEME_STORAGE_KEY };

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
  var customColor = localStorage.getItem('obsidian_cinema_custom_color') || '#e11d48';

  var solidThemes = THEMES.filter(function(t) { return !t.id.startsWith('pastel') && t.id !== 'rainbow'; });
  var pastelThemes = THEMES.filter(function(t) { return t.id.startsWith('pastel'); });
  var specialThemes = THEMES.filter(function(t) { return t.id === 'rainbow' || t.id === 'disco' || t.id === 'icecream'; });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="theme-selector">
          <div
            className="w-4 h-4 rounded-full border border-border"
            style={{ background: current === 'custom' ? customColor : (currentTheme ? currentTheme.preview : '#e11d48') }}
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
