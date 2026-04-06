import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Copy, Star, Clock, Check, Heart, Bookmark, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const placeholderPoster = "https://images.unsplash.com/photo-1761502479994-3a5e07ec243e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxjaW5lbWElMjB0aGVhdGVyJTIwZGFyayUyMGludGVyaW9yfGVufDB8fHx8MTc3MDIyMjgyNXww&ixlib=rb-4.1.0&q=85&w=300";

// Helper to resolve poster URLs (handles both local cached and TMDB URLs)
const resolvePosterUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('/api/')) {
    return `${BACKEND_URL}${path}`;
  }
  return path;
};

export default function MovieCard({ movie, onClick, onUpdate, index = 0 }) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (window.electronAPI?.openPath) {
      window.electronAPI.openPath(movie.file_path);
      toast.success("Opening with default player...");
    } else {
      // Web fallback: copy path
      navigator.clipboard.writeText(movie.file_path);
      toast.info("Path copied — paste in your video player", {
        action: {
          label: "Copy Path",
          onClick: () => handleCopyPath(e),
        },
      });
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/favorite`);
      if (onUpdate) {
        onUpdate({ ...movie, is_favorite: response.data.is_favorite });
      }
      toast.success(response.data.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      toast.error("Failed to update favorite status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/watchlist`);
      if (onUpdate) {
        onUpdate({ ...movie, is_watchlist: response.data.is_watchlist });
      }
      toast.success(response.data.is_watchlist ? "Added to watchlist" : "Removed from watchlist");
    } catch (err) {
      toast.error("Failed to update watchlist status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWatched = async (e) => {
    e.stopPropagation();
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/watched`);
      if (onUpdate) {
        onUpdate({ ...movie, watched: response.data.watched });
      }
      toast.success(response.data.watched ? "Marked as watched" : "Marked as unwatched");
    } catch (err) {
      toast.error("Failed to update watched status");
    } finally {
      setIsUpdating(false);
    }
  };

  const posterUrl = movie.poster_path && !imageError ? resolvePosterUrl(movie.poster_path) : placeholderPoster;
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
        
        {/* Top left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.is_favorite && (
            <div className="p-1.5 rounded-full bg-red-500/80 backdrop-blur-sm">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {movie.is_watchlist && (
            <div className="p-1.5 rounded-full bg-blue-500/80 backdrop-blur-sm">
              <Bookmark className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          {movie.watched && (
            <div className="p-1.5 rounded-full bg-green-500/80 backdrop-blur-sm">
              <Eye className="w-3 h-3 text-white" />
            </div>
          )}
          {!movie.metadata_fetched && !movie.is_favorite && !movie.is_watchlist && !movie.watched && (
            <div className="px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/50">
              <span className="text-xs text-orange-400">No metadata</span>
            </div>
          )}
        </div>
        
        {/* Rating badge */}
        {movie.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-white">{movie.rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="poster-overlay absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          {/* Main actions */}
          <div className="flex items-center gap-3">
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
          
          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`w-9 h-9 rounded-full ${movie.is_favorite ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'}`}
              onClick={handleToggleFavorite}
              disabled={isUpdating}
              data-testid={`favorite-btn-${movie.id}`}
            >
              <Heart className={`w-4 h-4 ${movie.is_favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-9 h-9 rounded-full ${movie.is_watchlist ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              onClick={handleToggleWatchlist}
              disabled={isUpdating}
              data-testid={`watchlist-btn-${movie.id}`}
            >
              <Bookmark className={`w-4 h-4 ${movie.is_watchlist ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-9 h-9 rounded-full ${movie.watched ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10'}`}
              onClick={handleToggleWatched}
              disabled={isUpdating}
              data-testid={`watched-btn-${movie.id}`}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
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
            {movie.genres.slice(0, 2).map((genre, i) => {
              const name = typeof genre === 'object' && genre.name ? genre.name : String(genre);
              return (
                <span
                  key={name + i}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-secondary text-secondary-foreground"
                >
                  {name}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
