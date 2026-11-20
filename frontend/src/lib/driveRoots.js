// Drive or network share a file lives on: "E:\" or "\\NAS\Media\"
export function rootOf(p) {
  if (!p) return null;
  const unc = p.match(/^[\\/]{2}([^\\/]+)[\\/]+([^\\/]+)/);
  if (unc) return '\\\\' + unc[1] + '\\' + unc[2] + '\\';
  const drive = p.match(/^([a-zA-Z]):/);
  return drive ? drive[1].toUpperCase() + ':\\' : null;
}

export const DRIVE_NAMES_KEY = 'obsidian_cinema_drive_names';

export function loadDriveNames() {
  try { return JSON.parse(localStorage.getItem(DRIVE_NAMES_KEY) || '{}') || {}; } catch (e) { return {}; }
}

// "Blue USB (E:\)" when nicknamed, otherwise just "E:\"
export function driveLabel(root, names) {
  const n = names && names[root];
  return n ? n + ' (' + root + ')' : root;
}
