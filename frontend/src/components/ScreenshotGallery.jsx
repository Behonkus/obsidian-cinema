import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Real app screenshots, taken with an invented sample library (original posters, made-up titles)
const SHOTS = [
  { id: "library", title: "Your library as a poster wall", desc: "Counts per type, one-click Add Folder and Update Library, and a filter bar that stays in view." },
  { id: "details", title: "Rich details for every title", desc: "Plot, cast, genres and ratings, tinted with the poster's colours, plus one-click Play." },
  { id: "tv-show", title: "Whole TV shows in one card", desc: "Seasons and episodes grouped automatically, each episode ready to play." },
  { id: "add-folder", title: "Add folders in three steps", desc: "Pick the type, choose any drive or network path, and scan every subfolder." },
  { id: "drives", title: "Every drive, even offline ones", desc: "Name your drives and see at a glance which ones need plugging in." },
  { id: "stats", title: "Stats about your collection", desc: "Hours per type, decades, ratings and more, all from the files you own." },
];

const EDGE = "max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem))";

const Slide = ({ s, onOpen }) => (
  <figure className="snap-start shrink-0 w-[85%] sm:w-[70%] lg:w-[56%] group" data-testid={`gallery-slide-${s.id}`}>
    <button
      type="button"
      onClick={() => onOpen(s)}
      className="relative block w-full h-[240px] sm:h-[340px] lg:h-[420px] rounded-2xl overflow-hidden border border-border/60 bg-[#08080a] shadow-2xl shadow-black/40 transition-[border-color,transform] duration-300 hover:border-primary/50 hover:-translate-y-1"
      data-testid={`gallery-open-${s.id}`}
    >
      <img src={`/screens/${s.id}.jpg`} alt={s.title} loading="lazy" className="w-full h-full object-contain" />
      <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 className="w-4 h-4" />
      </span>
    </button>
    <figcaption className="mt-4 pr-6">
      <p className="font-[Outfit] font-semibold text-foreground">{s.title}</p>
      <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
    </figcaption>
  </figure>
);

export const ScreenshotGallery = () => {
  const track = useRef(null);
  const [open, setOpen] = useState(null);
  const scrollBy = (dir) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };
  return (
    <section className="relative py-20 md:py-24" data-testid="screenshot-gallery">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-medium text-primary mb-2">See the real app</p>
          <h2 className="font-[Outfit] text-2xl md:text-3xl font-bold">A look inside Obsidian Cinema</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">Actual screenshots of the app, shown with a sample library of made-up titles. Yours will show your own collection.</p>
        </motion.div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} className="w-10 h-10 rounded-full border border-border hover:border-primary/60 hover:text-primary flex items-center justify-center transition-colors" aria-label="Previous screenshot" data-testid="gallery-prev">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} className="w-10 h-10 rounded-full border border-border hover:border-primary/60 hover:text-primary flex items-center justify-center transition-colors" aria-label="Next screenshot" data-testid="gallery-next">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:thin]"
        style={{ paddingInline: EDGE, scrollPaddingInline: EDGE }}
        data-testid="gallery-track"
      >
        {SHOTS.map(s => <Slide key={s.id} s={s} onOpen={setOpen} />)}
        <div className="shrink-0 w-2" />
      </div>
      <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <DialogContent className="max-w-6xl w-[95vw] p-3 bg-[#08080a]" data-testid="gallery-lightbox">
          {open && (
            <>
              <DialogTitle className="sr-only">{open.title}</DialogTitle>
              <DialogDescription className="sr-only">{open.desc}</DialogDescription>
              <img src={`/screens/${open.id}.jpg`} alt={open.title} className="w-full max-h-[82vh] object-contain rounded-lg" />
              <p className="text-sm text-muted-foreground px-1 pt-1"><span className="text-foreground font-medium">{open.title}</span> — {open.desc}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
