import React, { useState } from "react";
import {
  Eye, Play, Flame, CalendarDays, Type, SearchSlash,
  Timer, Brain, LetterText, Sparkles, RefreshCw, Film, Wand2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACTIVITY_KEY = 'obsidian_cinema_activity';
const BACKEND_API = process.env.REACT_APP_BACKEND_URL + '/api';

export function MostViewedMovies({ movies }) {
  var [resetCount, setResetCount] = useState(0);
  var activityRaw = localStorage.getItem(ACTIVITY_KEY);
  var activity = activityRaw ? JSON.parse(activityRaw) : {};
  var scored = movies
    .map(function(m) {
      var a = activity[m.id] || { views: 0, plays: 0 };
      return { movie: m, views: a.views || 0, plays: a.plays || 0, score: (a.plays || 0) * 3 + (a.views || 0) };
    })
    .filter(function(s) { return s.score > 0; })
    .sort(function(a, b) { return b.score - a.score; })
    .slice(0, 15);

  if (scored.length === 0) return null;

  return (
    <Card data-testid="most-viewed-movies">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Most Viewed / Played</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
            onClick={function() {
              localStorage.removeItem(ACTIVITY_KEY);
              setResetCount(resetCount + 1);
            }}
            data-testid="reset-activity-btn"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
        <div className="space-y-1.5">
        {scored.map(function(s, i) {
          return (
            <div key={s.movie.id} className="flex items-center gap-2 text-sm" data-testid={'most-viewed-' + i}>
              <span className="text-muted-foreground w-4 text-right text-xs">{i + 1}.</span>
              <span className="flex-1 truncate font-medium">{s.movie.title || s.movie.file_name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{s.views}</span>
                <span className="flex items-center gap-0.5"><Play className="w-3 h-3" />{s.plays}</span>
              </div>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}

export function BingeScore({ movies }) {
  var activityRaw = localStorage.getItem(ACTIVITY_KEY);
  var activity = activityRaw ? JSON.parse(activityRaw) : {};
  var now = Date.now();
  var day7 = now - 7 * 24 * 60 * 60 * 1000;
  var day30 = now - 30 * 24 * 60 * 60 * 1000;
  var views7 = 0, views30 = 0;
  Object.values(activity).forEach(function(a) {
    if (a.lastView) {
      if (a.lastView > day7) views7++;
      if (a.lastView > day30) views30++;
    }
  });
  var totalViews = Object.values(activity).reduce(function(sum, a) { return sum + (a.views || 0); }, 0);
  if (totalViews === 0) return null;

  return (
    <Card data-testid="binge-score">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-orange-400">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{views30}</p>
          <p className="text-xs text-muted-foreground">Movies browsed (30d)</p>
          <p className="text-xs text-muted-foreground/70">{views7} in the last 7 days</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AverageMovieAge({ movies }) {
  var withYear = movies.filter(function(m) {
    var y = parseInt(m.year, 10);
    return y && y > 1800 && y < 2100;
  });
  if (withYear.length === 0) return null;
  var sum = withYear.reduce(function(s, m) { return s + parseInt(m.year, 10); }, 0);
  var avg = Math.round(sum / withYear.length);
  var currentYear = new Date().getFullYear();
  var avgAge = currentYear - avg;
  var label = avgAge <= 5 ? "Cutting Edge" : avgAge <= 15 ? "Modern Classics" : avgAge <= 30 ? "Nostalgia Lover" : "Vintage Connoisseur";

  return (
    <Card data-testid="avg-movie-age">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-indigo-400">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{avg}</p>
          <p className="text-xs text-muted-foreground">Average release year</p>
          <p className="text-xs text-muted-foreground/70">~{avgAge} years old &middot; {label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TitleLengthRecords({ movies }) {
  var titled = movies.filter(function(m) { return m.title; });
  if (titled.length === 0) return null;
  titled.sort(function(a, b) { return b.title.length - a.title.length; });
  var longest = titled[0];
  var shortest = titled[titled.length - 1];
  var avgLen = Math.round(titled.reduce(function(s, m) { return s + m.title.length; }, 0) / titled.length);

  return (
    <Card data-testid="title-length-records">
      <CardContent className="p-4 space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Type className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium">Title Records</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Longest ({longest.title.length} chars)</span>
          <span className="font-medium text-xs truncate max-w-[60%] text-right">{longest.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Shortest ({shortest.title.length} chars)</span>
          <span className="font-medium text-xs">{shortest.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Average length</span>
          <span className="font-medium text-xs">{avgLen} chars</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function RarestDecade({ decadeData }) {
  if (!decadeData || decadeData.length < 2) return null;
  var sorted = decadeData.slice().sort(function(a, b) { return a.count - b.count; });
  var rarest = sorted[0];

  return (
    <Card data-testid="rarest-decade">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-rose-400">
          <SearchSlash className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{rarest.name}</p>
          <p className="text-xs text-muted-foreground">Your blind spot decade</p>
          <p className="text-xs text-muted-foreground/70">Only {rarest.count} movie{rarest.count !== 1 ? 's' : ''}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarathonMode({ total }) {
  if (!total || total <= 0) return null;
  var hours = Math.round(total * 88 / 60);
  var days = (hours / 24).toFixed(1);
  var weeks = (hours / 168).toFixed(1);
  var months = (hours / 730).toFixed(1);

  return (
    <Card data-testid="marathon-mode" className="h-full">
      <CardContent className="p-4 h-full flex flex-col justify-center flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Marathon Mode</span>
        </div>
        <p className="text-xs text-muted-foreground hidden md:block">If you watched every movie back-to-back (~88 min avg):</p>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{Number(hours).toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">hours</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{days}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{weeks}</p>
            <p className="text-[10px] text-muted-foreground">weeks</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{months}</p>
            <p className="text-[10px] text-muted-foreground">months</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 ml-auto">{total.toLocaleString()} movies at ~88 min avg</p>
      </CardContent>
    </Card>
  );
}

export function RatingPersonality({ avgRating, movies }) {
  var rated = movies.filter(function(m) { return m.rating; });
  if (rated.length === 0) return null;
  var high = rated.filter(function(m) { return m.rating >= 7; }).length;
  var low = rated.filter(function(m) { return m.rating < 5; }).length;
  var highPct = Math.round((high / rated.length) * 100);
  var lowPct = Math.round((low / rated.length) * 100);
  var spread = rated.reduce(function(s, m) { return s + Math.abs(m.rating - avgRating); }, 0) / rated.length;

  var personality, emoji, desc;
  if (spread > 2.5) {
    personality = "Eclectic Explorer"; emoji = "text-purple-400"; desc = "Wide range of ratings — you watch everything!";
  } else if (highPct > 70) {
    personality = "Blockbuster Fan"; emoji = "text-amber-400"; desc = highPct + "% of your rated movies are 7+";
  } else if (lowPct > 30) {
    personality = "Hidden Gem Hunter"; emoji = "text-emerald-400"; desc = "You dig into low-rated films others skip";
  } else if (avgRating > 7) {
    personality = "Quality Curator"; emoji = "text-blue-400"; desc = "Average rating " + avgRating.toFixed(1) + " — you pick winners";
  } else {
    personality = "Open-Minded Viewer"; emoji = "text-cyan-400"; desc = "A healthy mix of highs and lows";
  }

  return (
    <Card data-testid="rating-personality">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center bg-secondary " + emoji}>
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{personality}</p>
          <p className="text-xs text-muted-foreground">Your Rating Personality</p>
          <p className="text-xs text-muted-foreground/70">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlphabetCoverage({ movies }) {
  var titled = movies.filter(function(m) { return m.title; });
  if (titled.length === 0) return null;
  var letterCounts = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(l) { letterCounts[l] = 0; });
  var otherCount = 0;
  titled.forEach(function(m) {
    var first = m.title.charAt(0).toUpperCase();
    if (letterCounts[first] !== undefined) {
      letterCounts[first]++;
    } else {
      otherCount++;
    }
  });
  var letters = Object.keys(letterCounts);
  var maxCount = Math.max.apply(null, Object.values(letterCounts).concat([1]));
  var missing = letters.filter(function(l) { return letterCounts[l] === 0; });

  return (
    <Card data-testid="alphabet-coverage">
      <CardContent className="p-4 pb-3">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <LetterText className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium">Alphabet Coverage</span>
          <span className="ml-auto text-xs font-normal">{26 - missing.length}/26</span>
        </div>
        <div className="flex flex-wrap gap-[3px]">
          {letters.map(function(l) {
            var count = letterCounts[l];
            var intensity = count === 0 ? 0 : Math.max(0.2, count / maxCount);
            return (
              <div
                key={l}
                className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-mono"
                style={{ backgroundColor: count > 0 ? 'hsl(var(--primary) / ' + intensity + ')' : 'hsl(var(--muted))' }}
                title={l + ': ' + count + ' movies'}
                data-testid={'alpha-' + l}
              >
                <span className={count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}>{l}</span>
              </div>
            );
          })}
        </div>
        {missing.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1.5">Missing: {missing.join(', ')}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SuggestForMe({ movies }) {
  var [suggestions, setSuggestions] = useState([]);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState(null);

  var fetchSuggestions = async function() {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      var activityRaw = localStorage.getItem(ACTIVITY_KEY);
      var activity = activityRaw ? JSON.parse(activityRaw) : {};
      var allScored = movies.map(function(m) {
        var a = activity[m.id] || { views: 0, plays: 0 };
        return { movie: m, score: (a.plays || 0) * 3 + (a.views || 0) };
      }).filter(function(s) { return s.movie.title || s.movie.file_name; });
      if (allScored.length < 2) { setError('Need at least 2 movies'); setLoading(false); return; }
      allScored.sort(function(a, b) { return b.score - a.score; });
      var interacted = allScored.filter(function(s) { return s.score > 0; });
      var seed;
      if (interacted.length > 0) {
        var topPool = interacted.slice(0, Math.min(10, interacted.length));
        seed = topPool[Math.floor(Math.random() * topPool.length)].movie;
      } else {
        seed = allScored[Math.floor(Math.random() * Math.min(20, allScored.length))].movie;
      }
      var topWatched = interacted.slice(0, 15).map(function(s) {
        return (s.movie.title || s.movie.file_name) + ' (score:' + s.score + ')';
      });
      var activityContext = topWatched.length > 0
        ? 'User most-watched/clicked movies: ' + topWatched.join(', ')
        : 'No activity data yet — suggest based on the selected movie.';
      var toItem = function(m) {
        var genreStrs = (m.genres || []).map(function(g) { return typeof g === 'object' && g.name ? g.name : String(g); });
        return { id: m.id, title: m.title || m.file_name, year: m.year || null, genres: genreStrs, overview: m.overview ? m.overview.substring(0, 80) : null, rating: m.rating || null };
      };
      var candidateMap = {};
      allScored.forEach(function(s) {
        if (s.movie.id === seed.id) return;
        candidateMap[s.movie.id] = { item: toItem(s.movie), score: s.score };
      });
      var entries = Object.values(candidateMap);
      // Prioritize unwatched movies — put unplayed/unbrowsed first, then fill with watched
      var unwatched = entries.filter(function(e) { return e.score === 0; });
      var watched = entries.filter(function(e) { return e.score > 0; });
      // Shuffle unwatched so we get variety each time
      for (var si = unwatched.length - 1; si > 0; si--) {
        var sj = Math.floor(Math.random() * (si + 1));
        var tmp = unwatched[si]; unwatched[si] = unwatched[sj]; unwatched[sj] = tmp;
      }
      var candidates = unwatched.slice(0, 150).concat(watched.slice(0, 50)).map(function(e) { return e.item; });
      var resp = await fetch(BACKEND_API + '/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_movie: {
            id: seed.id, title: seed.title || seed.file_name, year: seed.year || null,
            genres: (seed.genres || []).map(function(g) { return typeof g === 'object' && g.name ? g.name : String(g); }),
            overview: seed.overview || null, rating: seed.rating || null,
          },
          library_movies: candidates,
          activity_context: activityContext + ' IMPORTANT: Suggest movies the user has NOT yet watched or browsed — help them discover hidden gems in their library.',
        }),
      });
      if (!resp.ok) { var err = await resp.json().catch(function() { return {}; }); throw new Error(err.detail || 'Failed to get suggestions'); }
      var data = await resp.json();
      setSuggestions(data.suggestions || []);
      if (!data.suggestions || data.suggestions.length === 0) setError('No suggestions found — try again');
    } catch (e) {
      setError(e.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card data-testid="suggest-for-me-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Wand2 className="w-4 h-4 text-primary" /> Suggest For Me
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">AI-powered picks based on your viewing activity — the more you browse and play, the smarter it gets.</p>
        <Button variant="outline" className="w-full gap-2" onClick={fetchSuggestions} disabled={loading} data-testid="suggest-for-me-btn">
          <Sparkles className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
          {loading ? 'Analyzing your library...' : 'Suggest For Me'}
        </Button>
        {error && !loading && (
          <p className="text-xs text-muted-foreground text-center">{error}</p>
        )}
        {!loading && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map(function(s) {
              var match = movies.find(function(m) { return m.id === s.id; });
              return (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40" data-testid={'suggestion-' + s.id}>
                  {match && match.poster_path ? (
                    <img src={match.poster_path} alt="" className="w-10 h-[60px] rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-[60px] rounded bg-secondary flex items-center justify-center shrink-0"><Film className="w-4 h-4 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{match?.year || ''}{match?.rating ? ' · ' + (match.rating.toFixed ? match.rating.toFixed(1) : match.rating) : ''}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">{s.reason}</p>
                  </div>
                </div>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={fetchSuggestions} data-testid="suggest-refresh-btn">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Get new suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
