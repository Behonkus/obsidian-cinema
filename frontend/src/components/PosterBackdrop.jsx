// Soft colour wash behind the library, tinted by the hovered poster
export const PosterBackdrop = ({ rgb }) => (
  <div
    aria-hidden="true"
    className="oc-backdrop fixed inset-0 -z-10 pointer-events-none"
    style={rgb ? { '--oc-r': rgb[0], '--oc-g': rgb[1], '--oc-b': rgb[2], opacity: 1 } : { opacity: 0 }}
    data-testid="poster-backdrop"
    data-rgb={rgb ? rgb.join(',') : ''}
  />
);
