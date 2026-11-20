import { toast } from "sonner";

export const GUIDE_URL = `${process.env.REACT_APP_BACKEND_URL}/Obsidian-Cinema-User-Guide.pdf`;

// Latest online guide, falling back to the copy bundled with the desktop app
export async function openUserGuide() {
  if (!window.electronAPI?.openGuide) { window.open(GUIDE_URL, '_blank', 'noopener'); return; }
  const res = await window.electronAPI.openGuide(GUIDE_URL).catch(() => null);
  if (res?.source === 'online') toast.success('Opening the User Guide…');
  else if (res?.source === 'offline') toast.info("You're offline — opened the copy of the User Guide saved with the app");
  else toast.error("Couldn't open the User Guide. Install a PDF viewer, or visit the website to download it.");
}
