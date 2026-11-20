import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    id: "source",
    q: "Where do the movies come from?",
    a: "From you. Obsidian Cinema doesn't provide, sell, host or stream any movies. It's a manager for the movie files you already have on your own drives. It finds them, adds posters, cast and ratings from TMDB, and plays them in your own media player.",
  },
  {
    id: "requirements",
    q: "What do I need to run it?",
    a: "A Windows 10 or 11 (64-bit) PC, your own movie files, and a free TMDB API key for posters and details. Getting a key takes about 2 minutes (see the guide above). The free plan organizes up to 500 of your files.",
  },
  {
    id: "privacy",
    q: "Are my files uploaded anywhere?",
    a: "No. Your movie files never leave your drives. The app only reads file names to look up posters and details, and your library is saved on your own PC.",
  },
  {
    id: "nas",
    q: "Does it work with a NAS or external drive?",
    a: "Yes. Add any folder Windows can open: local drives, USB and external drives, network shares or a NAS. Run Update Library whenever you add new files and they appear automatically.",
  },
  {
    id: "guide",
    q: "Is there a user guide?",
    a: "Yes. The Obsidian Cinema User Guide (PDF) covers installing, adding folders, TV shows, keeping your library up to date, drives, backups, Pro and troubleshooting. Download it from the User Guide link at the top or bottom of this page.",
  },
];

export const LandingFaq = () => (
  <section id="faq" className="py-20 md:py-28 px-6 border-t border-border/30" data-testid="faq-section">
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-10">
        <h2 className="text-base md:text-lg font-[Outfit] font-semibold text-primary mb-2">Questions</h2>
        <p className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight">Frequently asked</p>
      </motion.div>
      <Accordion type="single" collapsible defaultValue="source" className="rounded-xl border border-border/50 bg-card/60 px-5">
        {FAQS.map(f => (
          <AccordionItem key={f.id} value={f.id} className="border-border/40 last:border-b-0">
            <AccordionTrigger className="text-left font-[Outfit] font-semibold hover:no-underline hover:text-primary transition-colors" data-testid={`faq-q-${f.id}`}>{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed" data-testid={`faq-a-${f.id}`}>{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
