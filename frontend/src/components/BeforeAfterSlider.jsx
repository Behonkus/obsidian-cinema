import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronsLeftRight } from "lucide-react";

const BEFORE = "https://static.prod-images.emergentagent.com/jobs/2ff8f579-4e90-4c18-854e-f3fd4c43af64/images/9989ca61673025e4fdd5cc3598090db7f0c384594b30c0f8ceed9dbf8ec92900.jpeg";
const AFTER = "https://static.prod-images.emergentagent.com/jobs/2ff8f579-4e90-4c18-854e-f3fd4c43af64/images/811c82ab9bcbe01ec5d7466a54c1ef033a5ba57f20274dc180460cd62496a605.jpeg";

export const BeforeAfterSlider = () => {
  const [pos, setPos] = useState(50);
  const boxRef = useRef(null);
  const dragging = useRef(false);

  const moveTo = (clientX) => {
    const r = boxRef.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") setPos(p => Math.max(0, p - 5));
    if (e.key === "ArrowRight") setPos(p => Math.min(100, p + 5));
  };

  return (
    <section className="py-20 md:py-28 px-6 border-t border-border/30" data-testid="before-after-section">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-10">
          <h2 className="text-base md:text-lg font-[Outfit] font-semibold text-primary mb-2">Same files. A whole new view.</h2>
          <p className="text-2xl sm:text-3xl font-[Outfit] font-bold tracking-tight">From endless file lists to a poster wall</p>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">Drag the handle to see the movie files you already own, before and after Obsidian Cinema.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          ref={boxRef}
          className="relative aspect-[3/2] rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-primary/10 select-none cursor-ew-resize touch-none"
          onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e.clientX); }}
          onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
          onPointerUp={() => { dragging.current = false; }}
          data-testid="before-after-slider"
        >
          <img src={AFTER} alt="Obsidian Cinema poster wall of the same movie files" className="absolute inset-0 w-full h-full object-cover" draggable={false} data-testid="after-image" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img src={BEFORE} alt="Movie files in a plain Windows Explorer folder" className="absolute inset-0 w-full h-full object-cover" draggable={false} data-testid="before-image" />
          </div>
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-medium text-white" data-testid="before-label">Before · Windows Explorer</span>
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-xs font-medium text-primary-foreground" data-testid="after-label">After · Obsidian Cinema</span>
          <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%` }}>
            <button
              type="button"
              role="slider"
              aria-label="Compare before and after"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
              onKeyDown={onKey}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="before-after-handle"
            >
              <ChevronsLeftRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
