import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Film,
  FolderOpen,
  Image,
  Star,
  Clock,
  TrendingUp,
  BarChart3,
  Trash2,
  AlertCircle,
  Trophy,
  Calendar,
  Dice5,
  ThumbsDown,
  FolderHeart,
  Hourglass,
  Sparkles,
  Users,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MostViewedMovies, BingeScore, AverageMovieAge, TitleLengthRecords,
  RarestDecade, MarathonMode, RatingPersonality, AlphabetCoverage, SuggestForMe
} from "@/components/FunStats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const STORAGE_KEY = 'obsidian_cinema_local_movies';
const DIRS_KEY = 'obsidian_cinema_local_dirs';
const TRASH_KEY = 'obsidian_cinema_trash';
const COLLECTIONS_KEY = 'obsidian_cinema_collections';

const COLORS = ['hsl(var(--primary))', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1', '#f97316', '#14b8a6'];

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay || 0 }}>
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={"w-10 h-10 rounded-xl flex items-center justify-center bg-secondary " + (color || 'text-primary')}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DecadeChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Movies by Decade</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RatingChart({ data }) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function FormatChart({ data }) {
  if (!data || data.length === 0) return null;
  const cells = data.map(function(entry, idx) {
    return <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />;
  });
  const legend = data.map(function(f, idx) {
    return (
      <div key={f.name} className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
          <span className="font-mono text-xs">{f.name}</span>
        </div>
        <span className="text-muted-foreground text-xs">{f.value}</span>
      </div>
    );
  });
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">File Formats</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                {cells}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">{legend}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DirectoryChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Movies per Directory</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function TopRatedList({ movies }) {
  if (!movies || movies.length === 0) return null;
  const rows = movies.map(function(movie, i) {
    return (
      <div key={movie.id} className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{movie.title}</p>
        </div>
        <Badge variant="secondary" className="text-amber-400 bg-amber-400/10 text-xs">
          {'★ ' + movie.rating.toFixed(1)}
        </Badge>
      </div>
    );
  });
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Top Rated</span>
        </div>
        <div className="space-y-1.5">{rows}</div>
      </CardContent>
    </Card>
  );
}

function RecentList({ movies }) {
  if (!movies || movies.length === 0) return null;
  const rows = movies.map(function(movie) {
    return (
      <div key={movie.id} className="flex items-center gap-2 py-1">
        <Film className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-xs truncate flex-1">{movie.title}</span>
        {movie.added_at && (
          <span className="text-[10px] text-muted-foreground">{new Date(movie.added_at).toLocaleDateString()}</span>
        )}
      </div>
    );
  });
  return (
    <div className="pt-3 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Recently Added
      </p>
      {rows}
    </div>
  );
}

function LowestRatedList({ movies }) {
  if (!movies || movies.length === 0) return null;
  const rows = movies.map(function(movie, i) {
    return (
      <div key={movie.id} className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{movie.title}</p>
        </div>
        <Badge variant="secondary" className="text-red-400 bg-red-400/10 text-xs">
          {'★ ' + movie.rating.toFixed(1)}
        </Badge>
      </div>
    );
  });
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium">Lowest Rated</span>
        </div>
        <div className="space-y-1.5">{rows}</div>
      </CardContent>
    </Card>
  );
}

function GenreChart({ data }) {
  if (!data || data.length === 0) return null;
  const legend = data.slice(0, 8).map(function(item, i) {
    return (
      <div key={item.name} className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
        <span className="text-xs text-muted-foreground flex-1 truncate">{item.name}</span>
        <span className="text-xs font-medium text-foreground">{item.value}</span>
      </div>
    );
  });
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Genre Distribution</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex gap-4">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie data={data.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30} paddingAngle={2}>
                {data.slice(0, 8).map(function(_, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">{legend}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GrowthChart({ data }) {
  if (!data || data.length < 2) return null;
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Library Growth</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="added" fill="#10b981" radius={[4, 4, 0, 0]} name="Movies Added" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RandomPicker({ movies }) {
  const [pick, setPick] = useState(null);
  const [spinning, setSpinning] = useState(false);
  if (!movies || movies.length === 0) return null;

  function rollRandom() {
    setSpinning(true);
    setPick(null);
    let count = 0;
    const interval = setInterval(function() {
      setPick(movies[Math.floor(Math.random() * movies.length)]);
      count++;
      if (count > 8) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 120);
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Dice5 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">What Should I Watch?</span>
        </div>
        <Button variant="outline" className="w-full gap-2" onClick={rollRandom} disabled={spinning} data-testid="random-picker-btn">
          <Sparkles className={"w-4 h-4 " + (spinning ? 'animate-spin' : '')} />
          {spinning ? 'Picking...' : 'Pick a Random Movie'}
        </Button>
        {pick && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            {pick.poster_path ? (
              <img src={pick.poster_path} alt="" className="w-12 h-[72px] rounded object-cover" />
            ) : (
              <div className="w-12 h-[72px] rounded bg-secondary flex items-center justify-center"><Film className="w-5 h-5 text-muted-foreground" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{pick.title}</p>
              <p className="text-xs text-muted-foreground">{pick.year || ''} {pick.rating ? '★ ' + pick.rating.toFixed(1) : ''}</p>
              {pick.overview && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pick.overview}</p>}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function MostAppearingActors({ actors }) {
  if (!actors || actors.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium">Most Appearing Actors</span>
        </div>
        <div className="space-y-1.5">
        {actors.map(function(actor, i) {
          return (
            <div key={actor.name} className="flex items-center gap-2" data-testid={'top-actor-' + i}>
              <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
              {actor.photo ? (
                <img src={actor.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Users className="w-3 h-3 text-muted-foreground" /></div>
              )}
              <p className="text-sm font-medium truncate flex-1">{actor.name}</p>
              <Badge variant="secondary" className="text-blue-400 bg-blue-400/10 text-xs">{actor.count}</Badge>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}

function TopRatedActors({ actors }) {
  if (!actors || actors.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium">Top-Rated Actors</span>
        </div>
        <div className="space-y-1.5">
        {actors.map(function(actor, i) {
          return (
            <div key={actor.name} className="flex items-center gap-2" data-testid={'rated-actor-' + i}>
              <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
              {actor.photo ? (
                <img src={actor.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Users className="w-3 h-3 text-muted-foreground" /></div>
              )}
              <p className="text-sm font-medium truncate flex-1">{actor.name}</p>
              <span className="text-xs text-muted-foreground">{actor.movieCount} films</span>
              <Badge variant="secondary" className="text-amber-400 bg-amber-400/10 text-xs">{'★ ' + actor.avgRating.toFixed(1)}</Badge>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}

function GenreChameleons({ actors }) {
  if (!actors || actors.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Genre Chameleons</span>
        </div>
        <div className="space-y-1.5">
        {actors.map(function(actor, i) {
          return (
            <div key={actor.name} className="flex items-center gap-2" data-testid={'chameleon-actor-' + i}>
              <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
              {actor.photo ? (
                <img src={actor.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Users className="w-3 h-3 text-muted-foreground" /></div>
              )}
              <p className="text-sm font-medium truncate flex-1">{actor.name}</p>
              <Badge variant="secondary" className="text-emerald-400 bg-emerald-400/10 text-xs">{actor.genreCount} genres</Badge>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}

function computeStats(movies, directories, trashedMovies) {
  var withPosters = [];
  var withRatings = [];
  var withYears = [];
  var i;

  for (i = 0; i < movies.length; i++) {
    if (movies[i].poster_path) withPosters.push(movies[i]);
    if (movies[i].rating) withRatings.push(movies[i]);
    if (movies[i].year) withYears.push(movies[i]);
  }

  var ratingSum = 0;
  for (i = 0; i < withRatings.length; i++) ratingSum += withRatings[i].rating;
  var avgRating = withRatings.length ? ratingSum / withRatings.length : 0;

  var sortedByRating = withRatings.slice();
  sortedByRating.sort(function(a, b) { return b.rating - a.rating; });

  var sortedByYear = withYears.slice();
  sortedByYear.sort(function(a, b) { return b.year - a.year; });

  var decadesMap = {};
  for (i = 0; i < withYears.length; i++) {
    var dec = Math.floor(withYears[i].year / 10) * 10 + 's';
    decadesMap[dec] = (decadesMap[dec] || 0) + 1;
  }
  var decKeys = Object.keys(decadesMap);
  decKeys.sort();
  var decadeData = [];
  for (i = 0; i < decKeys.length; i++) decadeData.push({ name: decKeys[i], count: decadesMap[decKeys[i]] });

  var rBuckets = [0, 0, 0, 0, 0];
  for (i = 0; i < withRatings.length; i++) {
    var r = withRatings[i].rating;
    if (r < 2) rBuckets[0]++;
    else if (r < 4) rBuckets[1]++;
    else if (r < 6) rBuckets[2]++;
    else if (r < 8) rBuckets[3]++;
    else rBuckets[4]++;
  }
  var rLabels = ['0-2', '2-4', '4-6', '6-8', '8-10'];
  var ratingData = [];
  for (i = 0; i < 5; i++) ratingData.push({ name: rLabels[i], count: rBuckets[i] });

  var fmtMap = {};
  for (i = 0; i < movies.length; i++) {
    var fn = movies[i].file_name || '';
    var parts = fn.split('.');
    var ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'unknown';
    fmtMap[ext] = (fmtMap[ext] || 0) + 1;
  }
  var fmtKeys = Object.keys(fmtMap);
  fmtKeys.sort(function(a, b) { return fmtMap[b] - fmtMap[a]; });
  var formatData = [];
  for (i = 0; i < fmtKeys.length; i++) formatData.push({ name: '.' + fmtKeys[i], value: fmtMap[fmtKeys[i]] });

  var dirMap = {};
  for (i = 0; i < movies.length; i++) {
    var fp = movies[i].file_path || '';
    var sep = fp.indexOf('/') >= 0 ? '/' : '\\';
    var lastSep = fp.lastIndexOf(sep);
    var dir = lastSep >= 0 ? fp.substring(0, lastSep) : '';
    var segs = dir.split(sep);
    var shortDir = segs.length >= 2 ? segs[segs.length - 2] + sep + segs[segs.length - 1] : dir;
    dirMap[shortDir] = (dirMap[shortDir] || 0) + 1;
  }
  var dirKeys = Object.keys(dirMap);
  dirKeys.sort(function(a, b) { return dirMap[b] - dirMap[a]; });
  var dirData = [];
  var dirLimit = Math.min(dirKeys.length, 10);
  for (i = 0; i < dirLimit; i++) dirData.push({ name: dirKeys[i], count: dirMap[dirKeys[i]] });

  var withAdded = [];
  for (i = 0; i < movies.length; i++) {
    if (movies[i].added_at) withAdded.push(movies[i]);
  }
  withAdded.sort(function(a, b) { return (b.added_at || 0) - (a.added_at || 0); });

  var missingPosters = 0;
  var missingYear = 0;
  var missingRating = 0;
  var missingPosterList = [];
  var missingYearList = [];
  var missingRatingList = [];
  for (i = 0; i < movies.length; i++) {
    if (!movies[i].poster_path) { missingPosters++; missingPosterList.push({ id: movies[i].id, title: movies[i].title || movies[i].file_name }); }
    if (!movies[i].year) { missingYear++; missingYearList.push({ id: movies[i].id, title: movies[i].title || movies[i].file_name }); }
    if (!movies[i].rating) { missingRating++; missingRatingList.push({ id: movies[i].id, title: movies[i].title || movies[i].file_name }); }
  }

  var total = movies.length;
  var filled = (total * 3) - missingPosters - missingYear - missingRating;
  var completeness = total ? Math.round((filled / (total * 3)) * 100) : 0;

  // Lowest rated
  var lowestRated = sortedByRating.slice().reverse().slice(0, 5);

  // Genre distribution
  var genreMap = {};
  for (i = 0; i < movies.length; i++) {
    var genres = movies[i].genres;
    if (genres && Array.isArray(genres)) {
      for (var g = 0; g < genres.length; g++) {
        var genre = genres[g];
        if (typeof genre === 'object' && genre.name) genre = genre.name;
        if (typeof genre === 'string') genreMap[genre] = (genreMap[genre] || 0) + 1;
      }
    }
  }
  var genreKeys = Object.keys(genreMap);
  genreKeys.sort(function(a, b) { return genreMap[b] - genreMap[a]; });
  var genreData = [];
  for (i = 0; i < genreKeys.length; i++) genreData.push({ name: genreKeys[i], value: genreMap[genreKeys[i]] });

  // Growth timeline (movies added per month)
  var growthMap = {};
  for (i = 0; i < movies.length; i++) {
    if (movies[i].added_at) {
      var d = new Date(movies[i].added_at);
      var monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      growthMap[monthKey] = (growthMap[monthKey] || 0) + 1;
    }
  }
  var growthKeys = Object.keys(growthMap);
  growthKeys.sort();
  var growthData = [];
  for (i = 0; i < growthKeys.length; i++) {
    var parts2 = growthKeys[i].split('-');
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    growthData.push({ name: monthNames[parseInt(parts2[1], 10) - 1] + ' ' + parts2[0].slice(2), added: growthMap[growthKeys[i]] });
  }

  // Total estimated watch time (assume 2hr per movie)
  var totalHours = total * 2;
  var watchDays = Math.floor(totalHours / 24);
  var watchHours = totalHours % 24;

  // Collections stats
  var colsSaved = localStorage.getItem('obsidian_cinema_collections');
  var collections = colsSaved ? JSON.parse(colsSaved) : [];
  var totalInCollections = 0;
  for (i = 0; i < collections.length; i++) {
    totalInCollections += (collections[i].movie_ids || []).length;
  }

  // Cast stats
  var actorAppearances = {}; // name -> count
  var actorRatings = {};     // name -> { sum, count }
  var actorGenres = {};      // name -> Set of genres
  var actorPhotos = {};      // name -> profile_path
  for (i = 0; i < movies.length; i++) {
    var cast = movies[i].cast;
    if (cast && Array.isArray(cast)) {
      for (var c = 0; c < cast.length; c++) {
        var actorName = cast[c].name;
        if (!actorName) continue;
        actorAppearances[actorName] = (actorAppearances[actorName] || 0) + 1;
        if (cast[c].profile_path && !actorPhotos[actorName]) actorPhotos[actorName] = cast[c].profile_path;
        if (movies[i].rating) {
          if (!actorRatings[actorName]) actorRatings[actorName] = { sum: 0, count: 0 };
          actorRatings[actorName].sum += movies[i].rating;
          actorRatings[actorName].count += 1;
        }
        if (movies[i].genres && Array.isArray(movies[i].genres)) {
          if (!actorGenres[actorName]) actorGenres[actorName] = {};
          for (var ag = 0; ag < movies[i].genres.length; ag++) {
            var gn = movies[i].genres[ag];
            if (typeof gn === 'object' && gn.name) gn = gn.name;
            if (typeof gn === 'string') actorGenres[actorName][gn] = true;
          }
        }
      }
    }
  }
  // Most appearing actors (top 10)
  var actorKeys = Object.keys(actorAppearances);
  actorKeys.sort(function(a, b) { return actorAppearances[b] - actorAppearances[a]; });
  var topActors = [];
  for (i = 0; i < Math.min(actorKeys.length, 10); i++) {
    topActors.push({ name: actorKeys[i], count: actorAppearances[actorKeys[i]], photo: actorPhotos[actorKeys[i]] || null });
  }
  // Top-rated actors (min 5 movies, sorted by avg rating)
  var ratedActors = [];
  for (i = 0; i < actorKeys.length; i++) {
    var ar = actorRatings[actorKeys[i]];
    if (ar && ar.count >= 5) {
      ratedActors.push({ name: actorKeys[i], avgRating: ar.sum / ar.count, movieCount: ar.count, photo: actorPhotos[actorKeys[i]] || null });
    }
  }
  ratedActors.sort(function(a, b) { return b.avgRating - a.avgRating; });
  var topRatedActors = ratedActors.slice(0, 10);
  // Genre chameleon (most genres, min 2 movies)
  var chameleonActors = [];
  for (i = 0; i < actorKeys.length; i++) {
    if (actorAppearances[actorKeys[i]] >= 2 && actorGenres[actorKeys[i]]) {
      var genreList = Object.keys(actorGenres[actorKeys[i]]);
      chameleonActors.push({ name: actorKeys[i], genreCount: genreList.length, genres: genreList.slice(0, 4), photo: actorPhotos[actorKeys[i]] || null });
    }
  }
  chameleonActors.sort(function(a, b) { return b.genreCount - a.genreCount; });
  var topChameleons = chameleonActors.slice(0, 5);
  var moviesWithCast = 0;
  for (i = 0; i < movies.length; i++) {
    if (movies[i].cast && movies[i].cast.length > 0) moviesWithCast++;
  }

  return {
    total: total,
    dirCount: directories.length,
    posterCount: withPosters.length,
    posterPct: total ? Math.round((withPosters.length / total) * 100) : 0,
    avgRating: avgRating,
    topRated: sortedByRating.slice(0, 5),
    lowestRated: lowestRated,
    newest: sortedByYear[0] || null,
    oldest: sortedByYear.length > 0 ? sortedByYear[sortedByYear.length - 1] : null,
    decadeData: decadeData,
    ratingData: ratingData,
    formatData: formatData,
    dirData: dirData,
    genreData: genreData,
    growthData: growthData,
    recentlyAdded: withAdded.slice(0, 5),
    missingPosters: missingPosters,
    missingYear: missingYear,
    missingRating: missingRating,
    missingPosterList: missingPosterList,
    missingYearList: missingYearList,
    missingRatingList: missingRatingList,
    trashCount: trashedMovies.length,
    completeness: completeness,
    watchDays: watchDays,
    watchHours: watchHours,
    totalHours: totalHours,
    collectionCount: collections.length,
    totalInCollections: totalInCollections,
    topActors: topActors,
    topRatedActors: topRatedActors,
    topChameleons: topChameleons,
    moviesWithCast: moviesWithCast,
    uniqueActors: actorKeys.length,
  };
}

export default function StatsPage() {
  const [movies, setMovies] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [trashedMovies, setTrashedMovies] = useState([]);

  useEffect(function() {
    var saved = localStorage.getItem(STORAGE_KEY);
    var dirs = localStorage.getItem(DIRS_KEY);
    var trash = localStorage.getItem(TRASH_KEY);
    if (saved) setMovies(JSON.parse(saved));
    if (dirs) setDirectories(JSON.parse(dirs));
    if (trash) setTrashedMovies(JSON.parse(trash));
  }, []);

  var stats = useMemo(function() {
    return computeStats(movies, directories, trashedMovies);
  }, [movies, directories, trashedMovies]);

  if (movies.length === 0) {
    return (
      <div className="p-6" data-testid="stats-page">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-primary" /> Library Stats
        </h1>
        <Card className="p-8">
          <div className="text-center space-y-3">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h3 className="font-medium text-muted-foreground">No movies yet</h3>
            <p className="text-sm text-muted-foreground">Scan some directories to see your library stats</p>
          </div>
        </Card>
      </div>
    );
  }

  var posterSub = stats.posterCount + ' of ' + stats.total;
  var ratingSub = 'from ' + (stats.total - stats.missingRating) + ' rated';

  return (
    <div className="p-6 space-y-4" data-testid="stats-page">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Library Stats
        </h1>
        <p className="text-muted-foreground">Your collection at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Film} label="Total Movies" value={stats.total} delay={0} />
        <StatCard icon={FolderOpen} label="Directories" value={stats.dirCount} delay={0.03} color="text-amber-400" />
        <StatCard icon={Image} label="Poster Coverage" value={stats.posterPct + '%'} sub={posterSub} delay={0.06} color="text-green-400" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '\u2014'} sub={ratingSub} delay={0.09} color="text-amber-400" />
        <StatCard icon={FolderHeart} label="Collections" value={stats.collectionCount} sub={stats.totalInCollections + ' movies organized'} delay={0.12} color="text-purple-400" />
      </div>

      {(stats.newest || stats.oldest) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex gap-3">
            {stats.oldest && (
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Oldest in Library</p>
                    <p className="font-medium text-sm">{stats.oldest.title} ({stats.oldest.year})</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.newest && (
              <Card className="flex-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Newest in Library</p>
                    <p className="font-medium text-sm">{stats.newest.title} ({stats.newest.year})</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Fun Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <BingeScore movies={movies} />
        <AverageMovieAge movies={movies} />
        <RarestDecade decadeData={stats.decadeData} />
        <MarathonMode total={stats.total} />
        <RatingPersonality avgRating={stats.avgRating} movies={movies} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DecadeChart data={stats.decadeData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <RatingChart data={stats.ratingData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GenreChart data={stats.genreData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GrowthChart data={stats.growthData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <FormatChart data={stats.formatData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <DirectoryChart data={stats.dirData} />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <TopRatedList movies={stats.topRated} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <LowestRatedList movies={stats.lowestRated} />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <TitleLengthRecords movies={movies} />
        <AlphabetCoverage movies={movies} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <MostViewedMovies movies={movies} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium">Collection Health</span>
              </div>
              <HealthRow label="Missing Posters" count={stats.missingPosters} total={stats.total} color="text-orange-400" movieList={stats.missingPosterList} />
              <HealthRow label="Missing Year" count={stats.missingYear} total={stats.total} color="text-yellow-400" movieList={stats.missingYearList} />
              <HealthRow label="Missing Rating" count={stats.missingRating} total={stats.total} color="text-red-400" movieList={stats.missingRatingList} />
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Completeness</span>
                  <span className="font-medium text-foreground">{stats.completeness}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: stats.completeness + '%' }} />
                </div>
              </div>
              <RecentList movies={stats.recentlyAdded} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <RandomPicker movies={movies} />
        </motion.div>
        <SuggestForMe movies={movies} />
      </div>

      {/* Cast Stats */}
      {stats.moviesWithCast > 0 && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="flex items-center gap-2 pt-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Cast Insights</h2>
              <span className="text-xs text-muted-foreground">({stats.uniqueActors} actors across {stats.moviesWithCast} movies)</span>
            </div>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
              <MostAppearingActors actors={stats.topActors} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <TopRatedActors actors={stats.topRatedActors} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
              <GenreChameleons actors={stats.topChameleons} />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

function HealthRow({ label, count, total, color, movieList }) {
  var pct = total ? Math.round((count / total) * 100) : 0;
  var [expanded, setExpanded] = React.useState(false);
  var [showAll, setShowAll] = React.useState(false);
  var visibleList = showAll ? movieList : (movieList || []).slice(0, 10);
  return (
    <div>
      <div
        className={"flex items-center justify-between" + (count > 0 ? " cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-0.5 rounded transition-colors" : "")}
        onClick={() => { if (count > 0) setExpanded(!expanded); }}
        data-testid={'health-row-' + label.toLowerCase().replace(/\s/g, '-')}
      >
        <span className="text-sm text-foreground flex items-center gap-1.5">
          {label}
          {count > 0 && <ChevronDown className={"w-3 h-3 text-muted-foreground transition-transform " + (expanded ? "rotate-180" : "")} />}
        </span>
        <div className="flex items-center gap-2">
          <span className={"text-sm font-medium " + (count > 0 ? color : 'text-green-400')}>{count}</span>
          <span className="text-xs text-muted-foreground">({pct}%)</span>
        </div>
      </div>
      {expanded && movieList && movieList.length > 0 && (
        <div className="mt-1.5 mb-2 ml-2 space-y-0.5 max-h-48 overflow-y-auto" data-testid={'health-list-' + label.toLowerCase().replace(/\s/g, '-')}>
          {visibleList.map(function(m, idx) {
            return (
              <p key={m.id || idx} className="text-xs text-muted-foreground truncate pl-2 border-l-2 border-border py-0.5">
                {m.title}
              </p>
            );
          })}
          {!showAll && movieList.length > 10 && (
            <button
              className="text-xs text-primary hover:underline pl-2 pt-1"
              onClick={function(e) { e.stopPropagation(); setShowAll(true); }}
            >
              Show all {movieList.length} movies
            </button>
          )}
          {showAll && movieList.length > 10 && (
            <button
              className="text-xs text-primary hover:underline pl-2 pt-1"
              onClick={function(e) { e.stopPropagation(); setShowAll(false); }}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
