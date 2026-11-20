import { toast } from "sonner";
import GUIDE_PAGES from "@/lib/guidePages.json";

export const GUIDE_URL = `${process.env.REACT_APP_BACKEND_URL}/Obsidian-Cinema-User-Guide.pdf`;

// Latest online guide, falling back to the copy bundled with the desktop app
// chapter: key from guidePages.json (e.g. 'adding') to open at that page
export async function openUserGuide(chapter) {
  const page = typeof chapter === 'string' ? GUIDE_PAGES[chapter] : null;
  const url = GUIDE_URL + (page ? '#page=' + page : '');
  if (!window.electronAPI?.openGuide) { window.open(url, '_blank', 'noopener'); return; }
  const res = await window.electronAPI.openGuide(url).catch(() => null);
  if (res?.source === 'online') toast.success('Opening the User Guide…');
  else if (res?.source === 'offline') toast.info("You're offline — opened the copy of the User Guide saved with the app");
  else toast.error("Couldn't open the User Guide. Install a PDF viewer, or visit the website to download it.");
}
