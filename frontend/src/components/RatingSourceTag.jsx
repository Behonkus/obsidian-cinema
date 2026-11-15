// Small tag showing where a rating came from when it is not TMDB (e.g. "IMDb via Wikidata")
const SHORT = { IMDb: 'IMDb', Metacritic: 'MC', 'Rotten Tomatoes': 'RT', Critics: 'Critics', wikidata: 'WD' };

export const RatingSourceTag = ({ source, full = false }) => {
  if (!source) return null;
  const name = source === 'wikidata' ? 'Wikidata' : source;
  const text = full ? (source === 'wikidata' ? 'via Wikidata' : name + ' via Wikidata') : (SHORT[source] || name);
  return (
    <span
      title={source === 'wikidata' ? 'Rating from Wikidata' : name + ' rating via Wikidata'}
      className="inline-block ml-1 px-1 py-px rounded text-[9px] leading-none font-semibold tracking-wide bg-amber-400/15 text-amber-300 align-middle"
      data-testid={full ? 'rating-source-tag-full' : 'rating-source-tag'}
    >
      {text}
    </span>
  );
};
