// Small tag showing where a rating came from when it is not TMDB (e.g. "IMDb via Wikidata")
const SHORT = { IMDb: 'IMDb', Metacritic: 'MC', 'Rotten Tomatoes': 'RT', Critics: 'Critics', wikidata: 'WD' };

export const RatingSourceTag = ({ source, full = false }) => {
  if (!source) return null;
  const name = source === 'wikidata' ? 'Wikidata' : source;
  const text = full ? (source === 'wikidata' ? 'via Wikidata' : name + ' via Wikidata') : (SHORT[source] || name);
  return (
    <span
      title={source === 'wikidata' ? 'Rating from Wikidata' : name + ' rating via Wikidata'}
      className={(full ? "text-[11px] px-1.5 py-0.5" : "text-[9px] px-1 py-px") + " inline-block ml-1 rounded leading-none font-semibold tracking-wide bg-amber-400/15 text-amber-300 align-middle"}
      data-testid={full ? 'rating-source-tag-full' : 'rating-source-tag'}
    >
      {text}
    </span>
  );
};
