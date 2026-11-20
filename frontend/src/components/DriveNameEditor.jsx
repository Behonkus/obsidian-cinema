import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

// Inline nickname editor for a drive or network share
export const DriveNameEditor = ({ root, name, onSave, testid }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name || '');
  const save = () => { onSave(root, value.trim()); setEditing(false); };
  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setValue(name || ''); setEditing(true); }}
        className="group/dn inline-flex items-center gap-1.5 text-left min-w-0"
        title="Give this drive a nickname"
        data-testid={testid}
      >
        <span className={'truncate ' + (name ? 'font-semibold' : 'text-muted-foreground italic text-xs')}>{name || 'Add a nickname'}</span>
        <Pencil className="w-3 h-3 shrink-0 text-muted-foreground opacity-60 group-hover/dn:opacity-100" />
      </button>
    );
  }
  return (
    <form className="inline-flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); save(); }} onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); } }}
        placeholder='e.g. "Blue USB" or "Living-room NAS"'
        className="h-7 w-48 rounded-md bg-background border border-border px-2 text-xs focus:outline-none focus:border-primary/60"
        data-testid={testid + '-input'}
      />
      <button type="submit" className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-emerald-400" title="Save" data-testid={testid + '-save'}><Check className="w-3.5 h-3.5" /></button>
      <button type="button" onClick={() => setEditing(false)} className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center text-muted-foreground" title="Cancel"><X className="w-3.5 h-3.5" /></button>
    </form>
  );
};
