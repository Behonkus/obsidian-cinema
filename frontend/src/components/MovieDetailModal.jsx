import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const placeholderBackdrop = "https://images.unsplash.com/photo-1762541693135-fb989de961e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxjaW5lbWElMjB0aGVhdGVyJTIwZGFyayUyMGludGVyaW9yfGVufDB8fHx8MTc3MDIyMjgyNXww&ixlib=rb-4.1.0&q=85";

export default function MovieDetailModal({ movie, isOpen, onClose, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  if (!movie) return null;

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
    const mpcLink = `mpc-hc://play/${encodeURIComponent(movie.file_path)}`;
    window.location.href = mpcLink;
    toast.info("Opening in MPC-HC...", {
      description: "If it doesn't open, copy the path and paste in MPC-HC",
    });
  };

  const handleFetchMetadata = async () => {
    setIsFetching(true);
    try {
      const response = await axios.post(`${API}/movies/${movie.id}/fetch-metadata`);
      if (response.data.metadata_fetched) {
        toast.success("Metadata updated!");
        onUpdate?.(response.data);
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
      if (response.data.results?.length === 0) {
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
      onUpdate?.(response.data);
      setShowSearch(false);
      setSearchResults([]);
    } catch (err) {
      toast.error("Failed to set metadata");
    } finally {
      setIsFetching(false);
    }
  };

  const backdropUrl = movie.backdrop_path || placeholderBackdrop;
  const displayTitle = movie.title || movie.file_name;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          data-testid="movie-modal-overlay"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card border border-border shadow-2xl max-w-4xl w-full rounded-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            data-testid="movie-modal"
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full"
              onClick={onClose}
              data-testid="close-modal-btn"
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Backdrop image */}
            <div className="relative h-56 md:h-72 flex-shrink-0">
              <img
                src={backdropUrl}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              
              {/* Poster overlay on left */}
              {movie.poster_path && (
                <div className="absolute bottom-4 left-6 w-24 md:w-32 aspect-[2/3] rounded-lg overflow-hidden border-2 border-border shadow-xl">
                  <img
                    src={movie.poster_path}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            {/* Content */}
            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-6 pt-4">
                <div className={movie.poster_path ? "md:pl-36" : ""}>
                  {/* Title & meta */}
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
                  
                  {/* Genres */}
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {movie.genres.map((genre) => (
                        <Badge key={genre} variant="secondary" className="rounded-full">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Overview */}
                {movie.overview && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {movie.overview}
                  </p>
                )}
                
                {/* File path */}
                <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">File Path</p>
                  <p className="text-sm font-mono text-foreground break-all">
                    {movie.file_path}
                  </p>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    className="bg-primary hover:bg-primary/90 rounded-full px-6 glow-primary"
                    onClick={handlePlay}
                    data-testid="modal-play-btn"
                  >
                    <Play className="w-4 h-4 mr-2 fill-white" />
                    Play in MPC-HC
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
                    variant="ghost"
                    className="rounded-full px-6"
                    onClick={() => setShowSearch(!showSearch)}
                    data-testid="search-tmdb-btn"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search TMDB
                  </Button>
                </div>
                
                {/* TMDB Search section */}
                {showSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border"
                  >
                    <h4 className="font-medium mb-3">Search TMDB</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter movie title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1"
                        data-testid="tmdb-search-input"
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching}
                        data-testid="tmdb-search-btn"
                      >
                        {isSearching ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {searchResults.map((result) => (
                          <div
                            key={result.tmdb_id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-colors"
                            onClick={() => handleSelectResult(result.tmdb_id)}
                            data-testid={`search-result-${result.tmdb_id}`}
                          >
                            {result.poster_path && (
                              <img
                                src={result.poster_path}
                                alt={result.title}
                                className="w-12 h-18 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{result.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.year || "Unknown year"}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
