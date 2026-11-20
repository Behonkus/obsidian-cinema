// Drive or network share a file lives on: "E:\" or "\\NAS\Media\"
export function rootOf(p) {
  if (!p) return null;
  const unc = p.match(/^[\\/]{2}([^\\/]+)[\\/]+([^\\/]+)/);
  if (unc) return '\\\\' + unc[1] + '\\' + unc[2] + '\\';
  const drive = p.match(/^([a-zA-Z]):/);
  return drive ? drive[1].toUpperCase() + ':\\' : null;
}
