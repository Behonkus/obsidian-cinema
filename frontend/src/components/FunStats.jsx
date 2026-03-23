import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Play, Flame, CalendarDays, Type, SearchSlash,
  Timer, Brain, LetterText, Shuffle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ACTIVITY_KEY = 'obsidian_cinema_activity';

export function MostViewedMovies({ movies }) {
  var activityRaw = localStorage.getItem(ACTIVITY_KEY);
  var activity = activityRaw ? JSON.parse(activityRaw) : {};
  var scored = movies
    .map(function(m) {
      var a = activity[m.id] || { views: 0, plays: 0 };
      return { movie: m, views: a.views || 0, plays: a.plays || 0, score: (a.plays || 0) * 3 + (a.views || 0) };
    })
    .filter(function(s) { return s.score > 0; })
    .sort(function(a, b) { return b.score - a.score; })
    .slice(0, 10);

  if (scored.length === 0) return null;

  return (
    <Card data-testid="most-viewed-movies">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Eye className="w-4 h-4 text-blue-400" /> Most Viewed / Played
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {scored.map(function(s, i) {
          return (
            <div key={s.movie.id} className="flex items-center gap-2 text-sm" data-testid={'most-viewed-' + i}>
              <span className="text-muted-foreground w-5 text-right text-xs">{i + 1}.</span>
              <span className="flex-1 truncate font-medium">{s.movie.title || s.movie.file_name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{s.views}</span>
                <span className="flex items-center gap-0.5"><Play className="w-3 h-3" />{s.plays}</span>
              </div>
            </div>
          );
        })}
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
    if (a.last_viewed) {
      if (a.last_viewed > day7) views7++;
      if (a.last_viewed > day30) views30++;
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
  var withYear = movies.filter(function(m) { return m.year && m.year > 1800; });
  if (withYear.length === 0) return null;
  var sum = withYear.reduce(function(s, m) { return s + m.year; }, 0);
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Type className="w-4 h-4 text-pink-400" /> Title Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Longest title ({longest.title.length} chars)</p>
          <p className="font-medium truncate">{longest.title}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Shortest title ({shortest.title.length} chars)</p>
          <p className="font-medium">{shortest.title}</p>
        </div>
        <p className="text-xs text-muted-foreground">Average title length: {avgLen} characters</p>
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
  if (!total) return null;
  var hours = total * 2;
  var days = hours / 24;
  var weeks = days / 7;
  var months = days / 30.44;
  var display = months >= 2 ? months.toFixed(1) + ' months' : weeks >= 2 ? weeks.toFixed(1) + ' weeks' : days.toFixed(1) + ' days';

  return (
    <Card data-testid="marathon-mode">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary text-emerald-400">
          <Timer className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{display}</p>
          <p className="text-xs text-muted-foreground">Marathon Mode</p>
          <p className="text-xs text-muted-foreground/70">Back-to-back, no sleep, {hours.toLocaleString()} hours</p>
        </div>
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <LetterText className="w-4 h-4 text-violet-400" /> Alphabet Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-13 gap-1">
          {letters.map(function(l) {
            var count = letterCounts[l];
            var intensity = count === 0 ? 0 : Math.max(0.15, count / maxCount);
            return (
              <div
                key={l}
                className="aspect-square flex items-center justify-center rounded text-[10px] font-mono relative group cursor-default"
                style={{ backgroundColor: count > 0 ? 'hsl(var(--primary) / ' + intensity + ')' : 'hsl(var(--muted))' }}
                title={l + ': ' + count + ' movies'}
                data-testid={'alpha-' + l}
              >
                <span className={count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}>{l}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{26 - missing.length}/26 letters covered</span>
          {missing.length > 0 && <span>Missing: {missing.join(', ')}</span>}
          {otherCount > 0 && <span>{otherCount} start with #/symbol</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function RandomMoviePicker({ movies }) {
  var [pick, setPick] = useState(null);
  var [spinning, setSpinning] = useState(false);

  var doPick = function() {
    if (movies.length === 0) return;
    setSpinning(true);
    var count = 0;
    var interval = setInterval(function() {
      setPick(movies[Math.floor(Math.random() * movies.length)]);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setPick(movies[Math.floor(Math.random() * movies.length)]);
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <Card data-testid="random-movie-picker">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Shuffle className="w-4 h-4 text-teal-400" /> Random Movie Picker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={doPick} disabled={spinning} variant="outline" className="w-full" data-testid="random-pick-btn">
          <Shuffle className={"w-4 h-4 mr-2 " + (spinning ? "animate-spin" : "")} />
          {spinning ? "Shuffling..." : "Pick a random movie!"}
        </Button>
        {pick && (
          <div className={"p-3 rounded-lg bg-secondary/50 " + (spinning ? "animate-pulse" : "")}>
            <p className="font-medium">{pick.title || pick.file_name}</p>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              {pick.year && <span>{pick.year}</span>}
              {pick.rating && <Badge variant="outline" className="text-amber-400 text-[10px]">{pick.rating.toFixed ? pick.rating.toFixed(1) : pick.rating}</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
