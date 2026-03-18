import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Film,
  HardDrive,
  FolderOpen,
  Shield,
  Crown,
  Check,
  Monitor,
  Download,
  Zap,
  BarChart3,
  Palette,
  Trash2,
  Search,
  ArrowRight,
  ChevronRight,
  Star,
  Play,
  Grid3X3,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: HardDrive,
    title: "Scan Any Drive",
    desc: "Local drives, network shares, USB — Obsidian Cinema finds every movie file automatically.",
  },
  {
    icon: Film,
    title: "TMDB Posters & Metadata",
    desc: "Automatically fetches high-quality posters, ratings, release years, and genres from The Movie Database.",
  },
  {
    icon: Play,
    title: "One-Click Playback",
    desc: "Launch movies instantly in your default media player. No complicated setup required.",
  },
  {
    icon: SortAsc,
    title: "Advanced Sorting",
    desc: "Sort by title, year, rating, file size, directory, and more. 13 sort options to organize your way.",
  },
  {
    icon: BarChart3,
    title: "Library Stats",
    desc: "Visual charts showing movies by decade, rating distribution, genre breakdown, and collection insights.",
  },
  {
    icon: Palette,
    title: "18 Color Themes",
    desc: "Customize the look with solid, pastel, and animated themes. Your library, your style.",
  },
  {
    icon: Trash2,
    title: "Recently Deleted",
    desc: "Accidentally removed a movie? Restore it from the trash within 30 days.",
  },
  {
    icon: Search,
    title: "Manual Poster Editor",
    desc: "Search TMDB, paste a URL, or pick a local image — full control over every poster.",
  },
  {
    icon: Shield,
    title: "Auto Updates",
    desc: "Always running the latest version. Updates download silently in the background.",
  },
];

const FREE_LIMITS = ["Up to 50 movies", "Up to 3 collections", "All core features"];
const PRO_PERKS = ["Unlimited movies", "Unlimited collections", "Priority support", "Early access to features"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" data-testid="landing-page">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-primary" />
            </div>
            <span className="font-[Outfit] font-semibold text-lg tracking-tight">
              Obsidian Cinema
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              data-testid="nav-features-link"
            >
              Features
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              data-testid="nav-pricing-link"
            >
              Pricing
            </Button>
            <Button size="sm" onClick={handleLogin} data-testid="nav-signin-btn">
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="hero-glow-bg" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.06] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-medium text-primary mb-6">
            <Monitor className="w-3.5 h-3.5" />
            Windows Desktop App
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[Outfit] font-extrabold tracking-tight leading-[1.1]">
            Your movie library,
            <br />
            <span className="text-primary">beautifully organized.</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Obsidian Cinema scans your local and network drives, fetches posters and metadata from TMDB, and lets you play any movie with one click.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 px-8 text-base"
              onClick={handleLogin}
              data-testid="hero-get-started-btn"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 h-12 px-8 text-base border-border/60"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="hero-see-features-btn"
            >
              See Features
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Free tier supports up to 50 movies in your library. No credit card required.
          </p>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <h2 className="text-base md:text-lg font-[Outfit] font-semibold text-primary mb-2">
              Everything you need
            </h2>
            <p className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight">
              A powerful movie library manager
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group relative rounded-xl border border-border/50 bg-card/60 p-6 hover:border-primary/30 transition-colors duration-300"
                data-testid={`feature-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-[Outfit] font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 md:py-28 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <h2 className="text-base md:text-lg font-[Outfit] font-semibold text-primary mb-2">
              Get started in minutes
            </h2>
            <p className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight">
              Three steps to your perfect library
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Download,
                title: "Download & Install",
                desc: "Create an account, grab the Windows installer, and launch Obsidian Cinema.",
              },
              {
                step: "02",
                icon: FolderOpen,
                title: "Point to Your Drives",
                desc: "Add your movie directories — local folders, network shares, or USB drives.",
              },
              {
                step: "03",
                icon: Grid3X3,
                title: "Browse & Play",
                desc: "Posters appear automatically. Click any movie to play it in your default player.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="text-center"
              >
                <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-[Outfit] font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 md:py-28 px-6 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <h2 className="text-base md:text-lg font-[Outfit] font-semibold text-primary mb-2">
              Simple pricing
            </h2>
            <p className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight">
              Free forever. Pro when you need it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border/50 bg-card/60 p-6"
              data-testid="pricing-free-card"
            >
              <h3 className="font-[Outfit] font-semibold text-lg mb-1">Free</h3>
              <p className="text-3xl font-[Outfit] font-bold">
                $0
                <span className="text-sm font-normal text-muted-foreground ml-1">forever</span>
              </p>
              <ul className="mt-6 space-y-3">
                {FREE_LIMITS.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={handleLogin}
                data-testid="pricing-free-btn"
              >
                Get Started
              </Button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="relative rounded-xl border-2 border-primary/40 bg-card/80 p-6"
              data-testid="pricing-pro-card"
            >
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                Most Popular
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-[Outfit] font-semibold text-lg">Pro</h3>
              </div>
              <p className="text-3xl font-[Outfit] font-bold">
                $20
                <span className="text-sm font-normal text-muted-foreground ml-1">one-time</span>
              </p>
              <ul className="mt-6 space-y-3">
                {PRO_PERKS.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleLogin}
                data-testid="pricing-pro-btn"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 px-6 border-t border-border/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight mb-4">
            Ready to organize your movie collection?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join Obsidian Cinema today — it's free to start and takes less than a minute.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 px-10 text-base"
            onClick={handleLogin}
            data-testid="cta-get-started-btn"
          >
            Get Started Free
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            <span className="font-[Outfit] font-semibold text-sm">Obsidian Cinema</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Obsidian Cinema. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
