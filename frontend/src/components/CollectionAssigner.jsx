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
      <div className="space-y-1.5">
        {collections.map(col => {
          const allIds = getCollectionAllMovieIds(col);
          const isInParent = col.movie_ids.includes(movieId);
          const isInAny = allIds.has(movieId);
          const hasSubs = (col.sub_collections || []).length > 0;
          const isExpanded = expandedId === col.id;
          return (
            <div key={col.id} className="space-y-1">
              <div className="flex items-center gap-1">
                {hasSubs && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : col.id)}
                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`expand-collection-${col.id}`}
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                  </button>
                )}
                <Button
                  variant={isInAny ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs rounded-full gap-1 flex-1 justify-start"
                  onClick={() => {
                    toggleMovieInCollection(col.id, movieId);
                    toast.success(isInParent ? `Removed from "${col.name}"` : `Added to "${col.name}"`);
                  }}
                  data-testid={`toggle-collection-${col.id}`}
                >
                  {isInParent && <Check className="w-3 h-3" />}
                  {col.name}
                  {hasSubs && <Badge variant="secondary" className="h-3.5 px-1 text-[9px] ml-auto">{allIds.size}</Badge>}
                </Button>
              </div>
              {isExpanded && (
                <div className="pl-5 space-y-1">
                  {(col.sub_collections || []).map(sub => {
                    const isInSub = sub.movie_ids.includes(movieId);
                    return (
                      <div key={sub.id} className="flex items-center gap-1">
                        <Button
                          variant={isInSub ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-[11px] rounded-full gap-1 flex-1 justify-start"
                          onClick={() => {
                            toggleMovieInSubCollection(col.id, sub.id, movieId);
                            toast.success(isInSub ? `Removed from "${sub.name}"` : `Added to "${sub.name}"`);
                          }}
                          data-testid={`toggle-sub-${sub.id}`}
                        >
                          {isInSub && <Check className="w-3 h-3" />}
                          {sub.name}
                          <Badge variant="outline" className="h-3 px-1 text-[9px] ml-auto">{sub.movie_ids.length}</Badge>
                        </Button>
                        <button
                          onClick={() => deleteSubCollection(col.id, sub.id)}
                          className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                          data-testid={`delete-sub-${sub.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex gap-1">
                    <Input
                      placeholder="New sub-collection..."
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { createSubCollection(col.id, newSubName); setNewSubName(''); } }}
                      className="h-6 text-[11px] flex-1"
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
              )}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-1.5">
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
              <Plus className="w-3 h-3" /> New Collection
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
