import { thumbUrl } from "@/lib/tmdbMatcher";

const cache = new Map();

function loadImg(src, cors) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Average colour, weighted towards vivid pixels so dark/grey posters still tint
function sample(img) {
  const c = document.createElement('canvas');
  c.width = 24; c.height = 36;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 24, 36);
  const d = ctx.getImageData(0, 0, 24, 36).data;
  let r = 0, g = 0, b = 0, w = 0;
  for (let i = 0; i < d.length; i += 4) {
    const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
    const wt = 0.05 + ((mx - mn) / 255) * (mx / 255);
    r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
  }
  return lift([r / w, g / w, b / w]);
}

// Keep the tint visible on a near-black background
function lift([r, g, b]) {
  const mx = Math.max(r, g, b, 1);
  const k = mx < 150 ? 150 / mx : 1;
  return [r, g, b].map(v => Math.round(Math.min(255, v * k)));
}

function fromTitle(title) {
  let h = 0;
  for (let i = 0; i < (title || '').length; i++) h = (h * 31 + title.charCodeAt(i)) % 360;
  const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (0.55 - 0.35 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}

export async function getPosterColor(posterUrl, title) {
  const key = posterUrl || title;
  if (cache.has(key)) return cache.get(key);
  let rgb = null;
  if (posterUrl) {
    const src = thumbUrl(posterUrl, 'w92');
    for (const cors of [false, true]) {
      try { rgb = sample(await loadImg(src, cors)); break; } catch (e) { rgb = null; }
    }
  }
  rgb = rgb || fromTitle(title);
  cache.set(key, rgb);
  return rgb;
}
