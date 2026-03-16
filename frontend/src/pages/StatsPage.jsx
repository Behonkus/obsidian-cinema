import { useState, useEffect, useMemo } from "react";
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
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const COLORS = ['hsl(var(--primary))', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Movies by Decade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">File Formats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" stroke="none">
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Movies per Directory</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
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
    const poster = movie.poster_path
      ? <img src={movie.poster_path} alt="" className="w-8 h-12 rounded object-cover" />
      : <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center"><Film className="w-4 h-4 text-muted-foreground" /></div>;
    return (
      <div key={movie.id} className="flex items-center gap-3">
        <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
        {poster}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{movie.title}</p>
          <p className="text-xs text-muted-foreground">{movie.year || 'Unknown year'}</p>
        </div>
        <Badge variant="secondary" className="text-amber-400 bg-amber-400/10">
          {'★ ' + movie.rating.toFixed(1)}
        </Badge>
      </div>
    );
  });
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Trophy className="w-4 h-4 text-amber-400" /> Top Rated
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{rows}</CardContent>
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
  for (i = 0; i < movies.length; i++) {
    if (!movies[i].poster_path) missingPosters++;
    if (!movies[i].year) missingYear++;
    if (!movies[i].rating) missingRating++;
  }

  var total = movies.length;
  var filled = (total * 3) - missingPosters - missingYear - missingRating;
  var completeness = total ? Math.round((filled / (total * 3)) * 100) : 0;

  return {
    total: total,
    dirCount: directories.length,
    posterCount: withPosters.length,
    posterPct: total ? Math.round((withPosters.length / total) * 100) : 0,
    avgRating: avgRating,
    topRated: sortedByRating.slice(0, 5),
    newest: sortedByYear[0] || null,
    oldest: sortedByYear.length > 0 ? sortedByYear[sortedByYear.length - 1] : null,
    decadeData: decadeData,
    ratingData: ratingData,
    formatData: formatData,
    dirData: dirData,
    recentlyAdded: withAdded.slice(0, 5),
    missingPosters: missingPosters,
    missingYear: missingYear,
    missingRating: missingRating,
    trashCount: trashedMovies.length,
    completeness: completeness,
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
    <div className="p-6 space-y-6" data-testid="stats-page">
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
        <StatCard icon={Trash2} label="In Trash" value={stats.trashCount} delay={0.12} color="text-destructive" />
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

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <DecadeChart data={stats.decadeData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <RatingChart data={stats.ratingData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <FormatChart data={stats.formatData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <DirectoryChart data={stats.dirData} />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <TopRatedList movies={stats.topRated} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-orange-400" /> Collection Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <HealthRow label="Missing Posters" count={stats.missingPosters} total={stats.total} color="text-orange-400" />
              <HealthRow label="Missing Year" count={stats.missingYear} total={stats.total} color="text-yellow-400" />
              <HealthRow label="Missing Rating" count={stats.missingRating} total={stats.total} color="text-red-400" />
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
    </div>
  );
}

function HealthRow({ label, count, total, color }) {
  var pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={"text-sm font-medium " + (count > 0 ? color : 'text-green-400')}>{count}</span>
        <span className="text-xs text-muted-foreground">({pct}%)</span>
      </div>
    </div>
  );
}
