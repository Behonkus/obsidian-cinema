import { Clapperboard, Star, Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Avatar = ({ src }) => (src
  ? <img src={src} alt="" className="w-8 h-8 rounded-full object-cover" />
  : <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><Users className="w-3 h-3 text-muted-foreground" /></div>);

const PeopleList = ({ title, icon: Icon, color, rows, testId, render, onPick }) => {
  if (!rows || rows.length === 0) return null;
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Icon className={'w-4 h-4 ' + color} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <button type="button" key={(r.name || r.actor + r.director) + i} onClick={() => onPick(r)} className="w-full flex items-center gap-2 text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-secondary/60 transition-colors" data-testid={testId + '-' + i}>
              <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
              <Avatar src={r.photo} />
              {render(r)}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Name = ({ children }) => <p className="text-sm font-medium truncate flex-1">{children}</p>;

export const DirectorInsights = ({ stats, onPick }) => {
  const pickDirector = r => onPick({ name: r.name, role: "director", photo: r.photo });
  if (!stats || stats.films === 0) return null;
  return (
    <>
      <div className="flex items-center gap-2 pt-2" data-testid="director-insights">
        <Clapperboard className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold">Director Insights</h2>
        <span className="text-xs text-muted-foreground">({stats.uniqueDirectors} directors across {stats.films} films)</span>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
        <PeopleList title="Most Films Directed" icon={Clapperboard} color="text-violet-400" rows={stats.mostFilms} testId="director-most" onPick={pickDirector}
          render={r => <><Name>{r.name}</Name><Badge variant="secondary" className="text-violet-400 bg-violet-400/10 text-xs">{r.count}</Badge></>} />
        <PeopleList title="Top-Rated Directors" icon={Star} color="text-amber-400" rows={stats.topRated} testId="director-rated" onPick={pickDirector}
          render={r => <><Name>{r.name}</Name><span className="text-xs text-muted-foreground">{r.movieCount} films</span><Badge variant="secondary" className="text-amber-400 bg-amber-400/10 text-xs">{'★ ' + r.avgRating.toFixed(1)}</Badge></>} />
        <PeopleList title="Genre Range" icon={Sparkles} color="text-emerald-400" rows={stats.genreRange} testId="director-range" onPick={pickDirector}
          render={r => <><Name>{r.name}</Name><Badge variant="secondary" className="text-emerald-400 bg-emerald-400/10 text-xs">{r.genreCount} genres</Badge></>} />
      </div>
    </>
  );
};
