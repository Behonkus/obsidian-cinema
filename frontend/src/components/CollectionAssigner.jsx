import { useState } from "react";
import { FolderHeart, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CollectionAssigner({
  movieId,
  collections,
  toggleMovieInCollection,
  createCollection,
}) {
  const [newColName, setNewColName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  return (
    <div className="space-y-2" data-testid="add-to-collection-section">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <FolderHeart className="w-3.5 h-3.5" /> Collections
      </p>
      <div className="flex flex-wrap gap-1.5">
        {collections.map(col => {
          const isIn = col.movie_ids.includes(movieId);
          return (
            <Button
              key={col.id}
              variant={isIn ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs rounded-full gap-1"
              onClick={() => {
                toggleMovieInCollection(col.id, movieId);
                toast.success(isIn ? `Removed from "${col.name}"` : `Added to "${col.name}"`);
              }}
              data-testid={`toggle-collection-${col.id}`}
            >
              {isIn && <Check className="w-3 h-3" />}
              {col.name}
            </Button>
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
    </div>
  );
}
