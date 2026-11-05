import { ChevronDown, Film, Tv, Leaf, Sparkles, FolderOpen, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DIR_CATEGORIES_KEY = 'obsidian_cinema_dir_categories';

export const DIR_CATEGORIES = [
  { id: 'movies', label: 'Movies', icon: Film, cls: 'border-sky-500/50 text-sky-300 hover:bg-sky-500/15', active: 'bg-sky-500/25 border-sky-400 text-sky-100' },
  { id: 'tv', label: 'TV Shows', icon: Tv, cls: 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/15', active: 'bg-emerald-500/25 border-emerald-400 text-emerald-100' },
  { id: 'docs', label: 'Documentaries', icon: Leaf, cls: 'border-amber-500/50 text-amber-300 hover:bg-amber-500/15', active: 'bg-amber-500/25 border-amber-400 text-amber-100' },
  { id: 'anim', label: 'Animations', icon: Sparkles, cls: 'border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/15', active: 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-100' },
];

export function dirCategory(categories, dir) {
  return (categories && categories[dir]) || 'movies';
}

// True when a file path is inside a folder (D:\TV must not match D:\TVShows)
export function inDir(filePath, dir) {
  if (!filePath || !dir) return false;
  const d = dir.replace(/[\\/]+$/, '');
  if (!filePath.startsWith(d)) return false;
  const next = filePath.charAt(d.length);
  return next === '' || next === '\\' || next === '/';
}

function dirLabel(dir) {
  return dir.split(/[\\/]/).pop() || dir;
}

function CategoryDropdown({ cat, dirs, counts, activeDirectory, activeCategory, onPickDir, onPickCategory }) {
  const Icon = cat.icon;
  const total = dirs.reduce((t, d) => t + (counts[d] || 0), 0);
  const activeDir = dirs.find(d => d === activeDirectory);
  const isActive = activeCategory === cat.id || !!activeDir;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={'h-7 text-xs rounded-full px-3 gap-1.5 bg-transparent transition-colors ' + (isActive ? cat.active : cat.cls)}
          data-testid={`dir-cat-${cat.id}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="max-w-[240px] truncate">{activeDir ? cat.label + ': ' + dirLabel(activeDir) : cat.label}</span>
          <Badge variant="secondary" className="h-4 px-1 text-[10px]">{activeDir ? (counts[activeDir] || 0) : total}</Badge>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] max-h-80 overflow-y-auto" data-testid={`dir-cat-menu-${cat.id}`}>
        {dirs.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground max-w-[240px]">
            No folders set as {cat.label} yet. Choose a type for each folder in Manage Directories (gear icon).
          </div>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onPickCategory(cat.id)} data-testid={`dir-cat-all-${cat.id}`}>
              {activeCategory === cat.id ? <Check className="w-3.5 h-3.5 mr-2" /> : <Icon className="w-3.5 h-3.5 mr-2 opacity-60" />}
              <span className="flex-1 font-medium">All {cat.label}</span>
              <span className="text-[10px] text-muted-foreground ml-3">{total}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {dirs.map(d => (
              <DropdownMenuItem key={d} onClick={() => onPickDir(d)} title={d} data-testid={`dir-cat-item-${cat.id}-${dirLabel(d)}`}>
                {activeDirectory === d ? <Check className="w-3.5 h-3.5 mr-2" /> : <FolderOpen className="w-3.5 h-3.5 mr-2 opacity-60" />}
                <span className="flex-1 truncate">{dirLabel(d)}</span>
                <span className="text-[10px] text-muted-foreground ml-3">{counts[d] || 0}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// "All" button + one colored dropdown per folder type + manage gear
export function DirectoryDropdowns({ directories, categories, counts, totalCount, activeDirectory, activeCategory, onPickDir, onPickCategory, onClearAll, onManage }) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="directory-filter">
      <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
      <Button
        variant={!activeDirectory && !activeCategory ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs rounded-full px-3"
        onClick={onClearAll}
        data-testid="dir-filter-all"
      >
        All
        <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-1">{totalCount}</Badge>
      </Button>
      {DIR_CATEGORIES.map(cat => (
        <CategoryDropdown
          key={cat.id}
          cat={cat}
          dirs={directories.filter(d => dirCategory(categories, d) === cat.id)}
          counts={counts}
          activeDirectory={activeDirectory}
          activeCategory={activeCategory}
          onPickDir={onPickDir}
          onPickCategory={onPickCategory}
        />
      ))}
      <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 text-muted-foreground hover:text-foreground" onClick={onManage} title="Manage directories" data-testid="manage-dirs-btn">
        <Settings className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
