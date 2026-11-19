import { Film } from "lucide-react";
import { DIR_CATEGORIES } from "@/components/DirectoryDropdowns";
import { useCountUp } from "@/lib/effects";

const CHIP = {
  movies: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
  tv: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  docs: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  anim: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30',
};

function CountChip({ cat, n, fx, i }) {
  const shown = useCountUp(n, fx === 'full');
  return (
    <span
      className={'oc-chip-in inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border text-[11px] font-medium tabular-nums ' + CHIP[cat.id]}
      style={{ animationDelay: (i * 70) + 'ms' }}
      data-testid={`header-count-${cat.id}`}
    >
      <cat.icon className="w-3 h-3" />
      {shown.toLocaleString()} {n === 1 ? cat.one : cat.label}
    </span>
  );
}

export const LibraryHeader = ({ catCounts, total, folders, fx, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="space-y-2 min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
        <span className="oc-title-icon relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary">
          <Film className="w-5 h-5" />
        </span>
        <span className={fx === 'full' ? 'oc-title-shine' : ''}>Local Library</span>
      </h1>
      <div className="flex flex-wrap items-center gap-1.5" data-testid="library-header-counts">
        {DIR_CATEGORIES.filter(c => catCounts[c.id]).map((c, i) => (
          <CountChip key={c.id} cat={c} n={catCounts[c.id]} fx={fx} i={i} />
        ))}
        {total === 0 && <span className="text-xs text-muted-foreground">0 titles</span>}
        <span className="text-[11px] text-muted-foreground ml-1" data-testid="header-folder-count">
          {folders} {folders === 1 ? 'folder' : 'folders'}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2" data-testid="library-header-actions">{actions}</div>
  </div>
);
