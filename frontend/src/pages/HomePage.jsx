import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  RefreshCw, 
  Film, 
  FolderOpen,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import MovieCard from "@/components/MovieCard";
import MovieDetailModal from "@/components/MovieDetailModal";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState("all");
  const [metadataFilter, setMetadataFilter] = useState("all");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [gridSize, setGridSize] = useState("normal");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [moviesRes, dirsRes, statsRes] = await Promise.all([
        axios.get(`${API}/movies`),
        axios.get(`${API}/directories`),
        axios.get(`${API}/stats`),
      ]);
      setMovies(moviesRes.data);
      setDirectories(dirsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        (movie.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Directory filter
      const matchesDirectory = 
        selectedDirectory === "all" || movie.directory_id === selectedDirectory;
      
      // Metadata filter
      const matchesMetadata = 
        metadataFilter === "all" ||
        (metadataFilter === "with" && movie.metadata_fetched) ||
        (metadataFilter === "without" && !movie.metadata_fetched);
      
      return matchesSearch && matchesDirectory && matchesMetadata;
    });
  }, [movies, searchQuery, selectedDirectory, metadataFilter]);

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleMovieUpdate = (updatedMovie) => {
    setMovies((prev) =>
      prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m))
    );
    setSelectedMovie(updatedMovie);
  };

  const handleFetchAllMetadata = async () => {
    setIsFetchingAll(true);
    try {
      const response = await axios.post(`${API}/movies/fetch-all-metadata`);
      toast.success(`Updated ${response.data.updated} of ${response.data.total} movies`);
      loadData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("TMDB API key not configured");
      } else {
        toast.error("Failed to fetch metadata");
      }
    } finally {
      setIsFetchingAll(false);
    }
  };

  const gridClasses = {
    compact: "grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3",
    normal: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4",
    large: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10" data-testid="home-page">
      {/* Hero glow effect */}
      <div className="hero-glow-bg" />
      
      {/* Header */}
      <div className="relative z-10 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-[Outfit] tracking-tight text-foreground">
              Your Library
            </h1>
            <p className="text-muted-foreground mt-1">
              {stats?.total_movies || 0} movies • {stats?.with_metadata || 0} with metadata
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-4 py-2">
              <Film className="w-4 h-4 mr-2" />
              {stats?.total_movies || 0}
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <FolderOpen className="w-4 h-4 mr-2" />
              {stats?.total_directories || 0}
            </Badge>
            {stats?.without_metadata > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchAllMetadata}
                disabled={isFetchingAll}
                className="rounded-full"
                data-testid="fetch-all-metadata-btn"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingAll ? "animate-spin" : ""}`} />
                Fetch All ({stats.without_metadata})
              </Button>
            )}
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-3 mt-6"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border"
              data-testid="search-input"
            />
          </div>
          
          {/* Directory filter */}
          <Select value={selectedDirectory} onValueChange={setSelectedDirectory}>
            <SelectTrigger className="w-48 bg-secondary/50" data-testid="directory-filter">
              <FolderOpen className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Directories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directories</SelectItem>
              {directories.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Metadata filter */}
          <Select value={metadataFilter} onValueChange={setMetadataFilter}>
            <SelectTrigger className="w-44 bg-secondary/50" data-testid="metadata-filter">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Movies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Movies</SelectItem>
              <SelectItem value="with">With Metadata</SelectItem>
              <SelectItem value="without">Without Metadata</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Grid size toggle */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <Button
              variant={gridSize === "compact" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGridSize("compact")}
              className="h-8 w-8"
              data-testid="grid-compact-btn"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={gridSize === "normal" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setGridSize("normal")}
              className="h-8 w-8"
              data-testid="grid-normal-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
      
      {/* Content */}
      {directories.length === 0 ? (
        <EmptyState type="no-directories" />
      ) : movies.length === 0 ? (
        <EmptyState type="no-movies" />
      ) : filteredMovies.length === 0 ? (
        <EmptyState type="no-results" />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`grid ${gridClasses[gridSize]}`}
          data-testid="movie-grid"
        >
          {filteredMovies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => handleMovieClick(movie)}
              index={index}
            />
          ))}
        </motion.div>
      )}
      
      {/* Movie Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleMovieUpdate}
      />
    </div>
  );
}
