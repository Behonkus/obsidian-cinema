import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Play, 
  Copy, 
  Star, 
  Clock, 
  Calendar, 
  Check,
  Search,
  RefreshCw,
  ExternalLink,
  Heart,
  Bookmark,
  Eye,
  FolderHeart,
  Plus,
  Minus,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const placeholderBackdrop = "https://images.unsplash.com/photo-1762541693135-fb989de961e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxjaW5lbWElMjB0aGVhdGVyJTIwZGFyayUyMGludGVyaW9yfGVufDB8fHx8MTc3MDIyMjgyNXww&ixlib=rb-4.1.0&q=85";

// Helper to resolve image URLs (handles both local cached and TMDB URLs)
const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('/api/')) {
    return `${BACKEND_URL}${path}`;
  }
  return path;
};

export default function MovieDetailModal({ movie, isOpen, onClose, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    try {
      const response = await axios.get(`${API}/collections`);
      setCollections(response.data);
    } catch (err) {
      console.error("Failed to load collections:", err);
    }
  };

  if (!movie || !isOpen) return null;

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(movie.file_path);
      setCopied(true);
      toast.success("Path copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy path");
    }
  };

  const handlePlay = () => {
    // Use system default video player
    if (window.electronAPI?.openPath) {
      window.electronAPI.openPath(movie.file_path);
      toast.success("Opening with default player...");
    } else {
      // Web fallback: copy path
      navigator.clipboard.writeText(movie.file_path);
      toast.info("Path copied — paste in your video player");
    }
  };

  const handleFetchMetadata = async () => {
    setIsFetching(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/fetch-metadata`);
      if (response.data.metadata_fetched) {
        toast.success("Metadata updated!");
        if (onUpdate) onUpdate(response.data);
      } else {
        toast.info(response.data.message || "No results found");
        setShowSearch(true);
      }
    } catch (err) {
      toast.error("Failed to fetch metadata");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.post(
        `${API}/movies/${movie.id}/search-tmdb?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.results || []);
      if (!response.data.results || response.data.results.length === 0) {
        toast.info("No results found");
      }
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (tmdbId) => {
    setIsFetching(true);
    try {
      const response = await axios.post(
        `${API}/movies/${movie.id}/set-tmdb?tmdb_id=${tmdbId}`
      );
      toast.success("Metadata updated!");
      if (onUpdate) onUpdate(response.data);
      setShowSearch(false);
      setSearchResults([]);
    } catch (err) {
      toast.error("Failed to set metadata");
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/favorite`);
      if (onUpdate) onUpdate({ ...movie, is_favorite: response.data.is_favorite });
      toast.success(response.data.is_favorite ? "Added to favorites" : "Removed from favorites");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/watchlist`);
      if (onUpdate) onUpdate({ ...movie, is_watchlist: response.data.is_watchlist });
      toast.success(response.data.is_watchlist ? "Added to watchlist" : "Removed from watchlist");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleWatched = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/watched`);
      if (onUpdate) onUpdate({ ...movie, watched: response.data.watched });
      toast.success(response.data.watched ? "Marked as watched" : "Marked as unwatched");
    } catch (err) {
      toast.error("Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddToCollection = async (collectionId) => {
    try {
      await axios.post(`${API}/collections/${collectionId}/movies/${movie.id}`);
      const updatedCollectionIds = [...(movie.collection_ids || []), collectionId];
      if (onUpdate) onUpdate({ ...movie, collection_ids: updatedCollectionIds });
      toast.success("Added to collection");
    } catch (err) {
      toast.error("Failed to add to collection");
    }
  };

  const handleRemoveFromCollection = async (collectionId) => {
    try {
      await axios.delete(`${API}/collections/${collectionId}/movies/${movie.id}`);
      const updatedCollectionIds = (movie.collection_ids || []).filter(id => id !== collectionId);
      if (onUpdate) onUpdate({ ...movie, collection_ids: updatedCollectionIds });
      toast.success("Removed from collection");
    } catch (err) {
      toast.error("Failed to remove from collection");
    }
  };

  const isInCollection = (collectionId) => {
    return (movie.collection_ids || []).includes(collectionId);
  };

  const movieCollections = collections.filter(c => isInCollection(c.id));

  const backdropUrl = resolveImageUrl(movie.backdrop_path) || placeholderBackdrop;
  const posterUrl = resolveImageUrl(movie.poster_path);
  const displayTitle = movie.title || movie.file_name;
  const movieGenres = movie.genres || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        data-testid="movie-modal-overlay"
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-card border border-border shadow-2xl max-w-4xl w-full rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-testid="movie-modal"
        >
          {/* Quick action buttons in top left */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`bg-black/50 hover:bg-black/70 rounded-full ${movie.is_favorite ? 'text-red-400' : ''}`}
              onClick={handleToggleFavorite}
              disabled={isUpdating}
              data-testid="modal-favorite-btn"
            >
              <Heart className={`w-5 h-5 ${movie.is_favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`bg-black/50 hover:bg-black/70 rounded-full ${movie.is_watchlist ? 'text-blue-400' : ''}`}
              onClick={handleToggleWatchlist}
              disabled={isUpdating}
              data-testid="modal-watchlist-btn"
            >
              <Bookmark className={`w-5 h-5 ${movie.is_watchlist ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`bg-black/50 hover:bg-black/70 rounded-full ${movie.watched ? 'text-green-400' : ''}`}
              onClick={handleToggleWatched}
              disabled={isUpdating}
              data-testid="modal-watched-btn"
            >
              <Eye className="w-5 h-5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full"
            onClick={onClose}
            data-testid="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="relative h-56 md:h-72 flex-shrink-0">
            <img
              src={backdropUrl}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            
            {/* Poster with Change Poster overlay */}
            <div className="absolute bottom-4 left-6 w-24 md:w-32 aspect-[2/3] rounded-lg overflow-hidden border-2 border-border shadow-xl group">
              {posterUrl ? (
                <>
                  <img
                    src={posterUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay to change poster */}
                  <div 
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => setShowSearch(true)}
                    data-testid="change-poster-overlay"
                  >
                    <Search className="w-6 h-6 text-white mb-1" />
                    <span className="text-xs text-white font-medium">Change</span>
                    <span className="text-xs text-white font-medium">Poster</span>
                  </div>
                </>
              ) : (
                /* No poster - show search prompt */
                <div 
                  className="w-full h-full bg-secondary/50 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => setShowSearch(true)}
                  data-testid="add-poster-btn"
                >
                  <Search className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium text-center px-1">Find Poster</span>
                </div>
              )}
            </div>
          </div>
          
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-6 pt-4">
              <div className={posterUrl ? "md:pl-36" : ""}>
                <h2 className="text-2xl md:text-3xl font-bold font-[Outfit] text-foreground">
                  {displayTitle}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {movie.year && <span>{movie.year}</span>}
                  {movie.runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {movie.runtime} min
                    </span>
                  )}
                  {movie.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {movie.rating.toFixed(1)}
                    </span>
                  )}
                  {movie.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {movie.release_date}
                    </span>
                  )}
                </div>
                
                {movieGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {movieGenres.map((genre, idx) => (
                      <Badge key={`${genre}-${idx}`} variant="secondary" className="rounded-full">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {movie.overview && (
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
              )}
              
              <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">File Path</p>
                <p className="text-sm font-mono text-foreground break-all">
                  {movie.file_path}
                </p>
              </div>
              
              {/* Collections */}
              {movieCollections.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movieCollections.map((collection) => (
                    <Badge 
                      key={collection.id} 
                      variant="outline"
                      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50"
                      style={{ borderColor: collection.color, color: collection.color }}
                      onClick={() => handleRemoveFromCollection(collection.id)}
                    >
                      <FolderHeart className="w-3 h-3" />
                      {collection.name}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  className="bg-primary hover:bg-primary/90 rounded-full px-6 glow-primary"
                  onClick={handlePlay}
                  data-testid="modal-play-btn"
                >
                  <Play className="w-4 h-4 mr-2 fill-white" />
                  Play Movie
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full px-6"
                  onClick={handleCopyPath}
                  data-testid="modal-copy-btn"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy Path
                </Button>
                
                {/* Add to Collection dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-full px-6"
                      data-testid="add-to-collection-btn"
                    >
                      <FolderHeart className="w-4 h-4 mr-2" />
                      Collection
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Add to Collection</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {collections.length === 0 ? (
                      <DropdownMenuItem disabled>
                        No collections yet
                      </DropdownMenuItem>
                    ) : (
                      collections.map((collection) => (
                        <DropdownMenuItem
                          key={collection.id}
                          onClick={() => 
                            isInCollection(collection.id) 
                              ? handleRemoveFromCollection(collection.id)
                              : handleAddToCollection(collection.id)
                          }
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <FolderHeart 
                                className="w-4 h-4" 
                                style={{ color: collection.color }}
                              />
                              {collection.name}
                            </div>
                            {isInCollection(collection.id) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {!movie.metadata_fetched && (
                  <Button
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={handleFetchMetadata}
                    disabled={isFetching}
                    data-testid="fetch-metadata-btn"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                    Fetch Metadata
                  </Button>
                )}
                <Button
                  variant={showSearch ? "default" : "outline"}
                  className={`rounded-full px-6 ${showSearch ? 'bg-primary' : 'border-primary/50 text-primary hover:bg-primary/10'}`}
                  onClick={() => setShowSearch(!showSearch)}
                  data-testid="search-tmdb-btn"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {showSearch ? "Hide Search" : "Change Poster"}
                </Button>
              </div>
              
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-4 rounded-xl bg-gradient-to-b from-primary/5 to-secondary/30 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Find the Right Poster</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search TMDB to find the correct movie and update the poster
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter movie title (e.g., Avatar 2009)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="flex-1 bg-background"
                      data-testid="tmdb-search-input"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="tmdb-search-btn"
                    >
                      {isSearching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-xs text-muted-foreground mb-2">Click on a result to apply:</p>
                      {searchResults.map((result) => (
                        <div
                          key={result.tmdb_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-primary/10 hover:border-primary/30 border border-transparent cursor-pointer transition-all"
                          onClick={() => handleSelectResult(result.tmdb_id)}
                          data-testid={`search-result-${result.tmdb_id}`}
                        >
                          {result.poster_path ? (
                            <img
                              src={result.poster_path}
                              alt={result.title}
                              className="w-12 h-18 object-cover rounded shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-18 bg-secondary rounded flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.year || "Unknown year"}
                            </p>
                            {result.overview && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {result.overview}
                              </p>
                            )}
                          </div>
                          <Check className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      No results found. Try a different search term.
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
