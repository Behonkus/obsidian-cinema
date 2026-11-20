import {
  Wrench, ChevronDown, CheckSquare, FilePlus2, FileDown, Image, Sparkles, Wand2, Pause,
  AlertTriangle, Layers, FileEdit, Loader2, FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Item({ icon: Icon, label, hint, count, tone, onSelect, disabled, testid, spin }) {
  return (
    <DropdownMenuItem onSelect={onSelect} disabled={disabled} className="flex items-start gap-2.5 cursor-pointer py-2" data-testid={testid}>
      <Icon className={'w-4 h-4 mt-0.5 shrink-0 ' + (tone || 'opacity-70') + (spin ? ' animate-spin' : '')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{hint}</p>}
      </div>
      {count > 0 && <span className={'text-[10px] font-semibold tabular-nums px-1.5 rounded-full ' + (tone ? 'bg-amber-500/15 text-amber-300' : 'bg-secondary')}>{count.toLocaleString()}</span>}
    </DropdownMenuItem>
  );
}

// Every occasional library action, grouped in one menu
export const LibraryTools = (p) => {
  const attention = p.needsReview + p.multipart + p.mismatches;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-1.5 h-9 rounded-full px-4 border-border/70 hover:border-primary/60 transition-colors" data-testid="library-tools-btn">
          <Wrench className="w-4 h-4" />
          <span className="text-xs">Tools</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
          {attention > 0 && (
            <span className="oc-attn absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center" data-testid="library-tools-badge">
              {attention > 99 ? '99+' : attention}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[75vh] overflow-y-auto" data-testid="library-tools-menu">
        {attention > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-amber-400">Needs your attention</DropdownMenuLabel>
            {p.needsReview > 0 && <Item icon={AlertTriangle} tone="text-amber-400" label={p.reviewActive ? 'Show all titles' : 'Check uncertain matches'} hint="Titles whose match should be double-checked" count={p.needsReview} onSelect={p.onToggleReview} testid="needs-review-filter-btn" />}
            {p.multipart > 0 && <Item icon={Layers} tone="text-amber-400" label="Combine multi-part titles" hint="Files that look like parts of one title" count={p.multipart} onSelect={p.onMultipart} testid="multipart-suggest-btn" />}
            {p.mismatches > 0 && <Item icon={FileEdit} tone="text-amber-400" label="File names with a different year" hint="Rename files to match the correct year" count={p.mismatches} onSelect={p.onMismatches} testid="year-mismatch-chip" />}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Metadata</DropdownMenuLabel>
        <Item icon={p.fetchingPosters ? Loader2 : Image} spin={p.fetchingPosters} label={p.fetchingPosters ? 'Fetching posters…' : 'Fetch posters'} hint="Find posters for titles that don't have one" count={p.missingPoster} onSelect={p.onFetchPosters} disabled={p.fetchingPosters} testid="fetch-posters-btn" />
        {p.needsDetails > 0 && <Item icon={Sparkles} label={p.fetchingCast ? 'Enriching… ' + p.castProgress + '%' : 'Enrich details'} hint="Add cast, director, runtime and ratings" count={p.needsDetails} onSelect={p.onEnrich} disabled={p.fetchingCast || p.fetchingPosters} testid="enrich-metadata-btn" />}
        {p.fixCount != null && <Item icon={Wand2} label={p.fixRun ? 'Fixing ' + p.fixRun.done + '/' + p.fixRun.total : 'Fix missing info'} hint="Fill gaps from TMDB and Wikidata" count={p.fixCount} onSelect={p.onFix} disabled={!!p.fixRun || p.fixCount === 0} testid="fix-missing-btn" />}
        {p.showAutoFill && (
          <Item
            icon={p.bgEnrich ? Loader2 : (p.autoEnrich ? Sparkles : Pause)}
            spin={!!p.bgEnrich}
            tone={p.autoEnrich ? 'text-emerald-400' : undefined}
            label={<span data-testid="auto-enrich-status">{p.bgEnrich ? 'Auto-filling ' + p.bgEnrich.done + '/' + p.bgEnrich.total : (p.autoEnrich ? 'Auto-fill on' : 'Auto-fill paused')}</span>}
            hint={p.autoEnrich ? 'New files are matched and filled in quietly. Click to pause.' : 'Click to fill in missing details in the background'}
            onSelect={(e) => { e.preventDefault(); p.onToggleAutoFill(); }}
            testid="auto-enrich-toggle"
          />
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">Library</DropdownMenuLabel>
        {p.hasTitles && <Item icon={CheckSquare} label="Select titles" hint="Pick several titles to move them to another category" onSelect={p.onSelect} testid="select-mode-btn" />}
        <Item icon={FilePlus2} label="Add files…" hint="Pick single video files, e.g. one film in Downloads" onSelect={p.onAddFiles} testid="add-files-btn" />
        <Item icon={FolderPlus} label="Add folders…" hint="Pick one or more folders; every subfolder (seasons, extras) is included and rescanned on Update Library" onSelect={p.onAddFolders} testid="add-folders-btn" />
        {p.hasTitles && <Item icon={FileDown} label="Export list as PDF" hint="Print or share what's currently shown" onSelect={p.onPdf} testid="pdf-export-trigger" />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
