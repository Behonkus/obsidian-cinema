import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const compareVersions = (a, b) => {
  const pa = String(a).replace(/^v/, "").split(".").map(Number);
  const pb = String(b).replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff) return diff;
  }
  return 0;
};

export const fetchChangelog = async () => {
  try {
    const res = await axios.get(`${API}/changelog`, { timeout: 8000 });
    return res.data?.releases || [];
  } catch {
    return [];
  }
};

// Releases with from < version <= to, newest first
export const releasesBetween = (releases, from, to) =>
  releases
    .filter((r) => (!from || compareVersions(r.version, from) > 0) && compareVersions(r.version, to) <= 0)
    .sort((a, b) => compareVersions(b.version, a.version));

export const notesToList = (notes) => {
  if (!notes) return [];
  const text = Array.isArray(notes) ? notes.map((n) => n.note || "").join("\n") : String(notes);
  return text
    .replace(/<li[^>]*>/gi, "\n").replace(/<[^>]+>/g, "")
    .split("\n").map((l) => l.replace(/^[\s*\-•]+/, "").trim())
    .filter((l) => l && !/^#/.test(l)).slice(0, 12);
};
