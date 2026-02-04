import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Copy, Star, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const placeholderPoster = "https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjB0aGVhdGVyJTIwZGFyayUyMGludGVyaW9yfGVufDB8fHx8MTc3MDIyMjgyNXww&ixlib=rb-4.1.0&q=85&w=300";

export default function MovieCard({ movie, onClick, onFetchMetadata, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopyPath = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(movie.file_path);
      setCopied(true);
      toast.success("Path copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy path");
    }
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    // Create MPC-HC protocol link
    const mpcLink = `mpc-hc://play/${encodeURIComponent(movie.file_path)}`;
    
    // Try to open with protocol handler
    window.location.href = mpcLink;
    
    toast.info("Opening in MPC-HC...", {
      description: "If it doesn't open, copy the path and paste in MPC-HC",
      action: {
        label: "Copy Path",
        onClick: () => handleCopyPath(e),
      },
    });
  };

  const posterUrl = movie.poster_path && !imageError ? movie.poster_path : placeholderPoster;
  const displayTitle = movie.title || movie.file_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="poster-card relative group overflow-hidden rounded-lg bg-card border border-border/50 cursor-pointer"
      onClick={onClick}
      data-testid={`movie-card-${movie.id}`}
    >
      {/* Poster Image */}
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={posterUrl}
          alt={displayTitle}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent" />
        
        {/* Rating badge */}
        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-white">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        {/* No metadata indicator */}
        {!movie.metadata_fetched && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/50">
            <span className="text-xs text-orange-400">No metadata</span>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="poster-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center gap-3">
          <Button
            variant="default"
            size="icon"
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 glow-primary"
            onClick={handlePlay}
            data-testid={`play-btn-${movie.id}`}
          >
            <Play className="w-5 h-5 fill-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full"
            onClick={handleCopyPath}
            data-testid={`copy-btn-${movie.id}`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
          {displayTitle}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          {movie.year && <span>{movie.year}</span>}
          {movie.runtime && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {movie.runtime}m
              </span>
            </>
          )}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {movie.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 text-[10px] rounded-full bg-secondary text-secondary-foreground"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
