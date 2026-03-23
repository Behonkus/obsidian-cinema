import { useState } from "react";
import { FolderHeart, Check, Plus, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function CollectionAssigner({
  movieId,
  collections,
  getCollectionAllMovieIds,
  toggleMovieInCollection,
  toggleMovieInSubCollection,
  createCollection,
  createSubCollection,
  deleteSubCollection,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [newColName, setNewColName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  return (
    <div className="space-y-2" data-testid="add-to-collection-section">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <FolderHeart className="w-3.5 h-3.5" /> Collections
      </p>
      <div className="flex flex-wrap gap-1.5">
        {collections.map(col => {
          const allIds = getCollectionAllMovieIds(col);
          const isInParent = col.movie_ids.includes(movieId);
          const isInAny = allIds.has(movieId);
          const hasSubs = (col.sub_collections || []).length > 0;
          const isExpanded = expandedId === col.id;
          return (
            <div key={col.id}>
              <Button
                variant={isInAny ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs rounded-full gap-1"
                onClick={() => {
                  if (hasSubs) {
                    setExpandedId(isExpanded ? null : col.id);
                  } else {
                    toggleMovieInCollection(col.id, movieId);
                    toast.success(isInParent ? `Removed from "${col.name}"` : `Added to "${col.name}"`);
                  }
                }}
                data-testid={`toggle-collection-${col.id}`}
              >
                {isInParent && <Check className="w-3 h-3" />}
                {col.name}
                {hasSubs && <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />}
              </Button>
            </div>
          );
        })}
        {showNewInput ? (
          <div className="flex gap-1">
            <Input
              placeholder="Collection name"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { createCollection(newColName); setNewColName(''); setShowNewInput(false); } }}
              className="h-7 text-xs w-36"
              autoFocus
              data-testid="new-collection-input"
            />
            <Button size="sm" className="h-7 text-xs px-2" onClick={() => { createCollection(newColName); setNewColName(''); setShowNewInput(false); }} data-testid="confirm-new-collection-btn">
              <Check className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-full gap-1 border border-dashed border-border"
            onClick={() => setShowNewInput(true)}
            data-testid="new-collection-btn"
          >
            <Plus className="w-3 h-3" /> New
          </Button>
        )}
      </div>
      {expandedId && (() => {
        const col = collections.find(c => c.id === expandedId);
        if (!col) return null;
        const isInParent = col.movie_ids.includes(movieId);
        return (
          <div className="pl-4 space-y-2 border-l-2 border-border" data-testid={`sub-collections-${col.id}`}>
            <div className="flex items-center gap-2">
              <Button
                variant={isInParent ? "default" : "outline"}
                size="sm"
                className="h-6 text-[11px] rounded-full gap-1"
                onClick={() => {
                  toggleMovieInCollection(col.id, movieId);
                  toast.success(isInParent ? `Removed from "${col.name}"` : `Added to "${col.name}"`);
                }}
                data-testid={`toggle-parent-${col.id}`}
              >
                {isInParent && <Check className="w-3 h-3" />}
                {col.name} (all)
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(col.sub_collections || []).map(sub => {
                const isInSub = sub.movie_ids.includes(movieId);
                return (
                  <div key={sub.id} className="flex items-center gap-0.5">
                    <Button
                      variant={isInSub ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[11px] rounded-full gap-1"
                      onClick={() => {
                        toggleMovieInSubCollection(col.id, sub.id, movieId);
                        toast.success(isInSub ? `Removed from "${sub.name}"` : `Added to "${sub.name}"`);
                      }}
                      data-testid={`toggle-sub-${sub.id}`}
                    >
                      {isInSub && <Check className="w-3 h-3" />}
                      {sub.name}
                    </Button>
                    <button
                      onClick={() => deleteSubCollection(col.id, sub.id)}
                      className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`delete-sub-${sub.id}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
              <div className="flex gap-1">
                <Input
                  placeholder="New sub..."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { createSubCollection(col.id, newSubName); setNewSubName(''); } }}
                  className="h-6 text-[11px] w-24"
                  data-testid={`new-sub-input-${col.id}`}
                />
                <Button
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => { createSubCollection(col.id, newSubName); setNewSubName(''); }}
                  data-testid={`confirm-new-sub-${col.id}`}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
