import { motion } from "framer-motion";
import { Film, FolderOpen, ScanSearch, Network, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpLink } from "@/components/HelpLink";

const STEPS = [
  { icon: Film, title: "Choose the type", text: "Tell us what's in the folder: Movies, TV Shows, Documentaries or Animations. TV shows become one card per show, with every season inside." },
  { icon: FolderOpen, title: "Pick your folder", text: "Click Add Folder and choose a drive, type a path (e.g. E:\\TV Shows), or use \"Choose with Windows…\". Every subfolder is included." },
  { icon: ScanSearch, title: "Scan and watch posters appear", text: "Hit Scan. Your files are matched with TMDB and posters, cast and ratings fill in automatically." },
];

// Three-step guide shown while the library is empty
export const WelcomeGuide = ({ addFolderButton }) => (
  <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 md:p-10 space-y-8" data-testid="welcome-guide">
    <div className="space-y-2 max-w-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">Welcome to Obsidian Cinema</p>
      <h2 className="text-2xl md:text-3xl font-bold font-[Outfit] flex items-center gap-2">Add your first folder in three steps <HelpLink chapter="adding" label="Adding your collection" /></h2>
      <p className="text-sm text-muted-foreground">Point Obsidian Cinema at the movie files you already own and it turns them into a poster wall.</p>
    </div>

    <ol className="grid md:grid-cols-3 gap-4">
      {STEPS.map((s, i) => (
        <motion.li
          key={s.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.12 }}
          className="relative rounded-xl border border-border/60 bg-background/50 p-5 space-y-2"
          data-testid={`welcome-step-${i + 1}`}
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <s.icon className="w-5 h-5 text-primary/80" />
          </div>
          <p className="font-semibold">{s.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
        </motion.li>
      ))}
    </ol>

    <div className="flex flex-wrap items-center gap-3" data-testid="welcome-actions">
      {addFolderButton}
    </div>

    <div className="grid md:grid-cols-2 gap-3 text-sm">
      <div className="flex gap-3 rounded-lg bg-secondary/40 p-3" data-testid="welcome-tip-drag">
        <MousePointerClick className="w-4 h-4 mt-0.5 text-primary shrink-0" />
        <p className="text-muted-foreground"><span className="text-foreground font-medium">Tip:</span> you can also drag a folder from Windows Explorer and drop it anywhere on this page.</p>
      </div>
      <div className="flex gap-3 rounded-lg bg-secondary/40 p-3" data-testid="welcome-tip-network">
        <Network className="w-4 h-4 mt-0.5 text-primary shrink-0" />
        <p className="text-muted-foreground"><span className="text-foreground font-medium">Network drive missing?</span> Open Obsidian Cinema normally, not with "Run as administrator" — Windows hides mapped network drives from apps run as administrator. You can also type the network path, e.g. \\NAS\Movies.</p>
      </div>
    </div>
  </div>
);
