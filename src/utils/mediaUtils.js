export function getMediaKey(mediaType, id) {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `${type}-${id}`;
}

export function getFirestoreMediaKeys(mediaType, id) {
  const type = mediaType === "tv" ? "tv" : "movie";
  const primary = getMediaKey(type, id);
  if (type === "movie") {
    const legacy = String(id);
    return primary === legacy ? [primary] : [primary, legacy];
  }
  return [primary];
}

export function parseMediaKey(key) {
  const str = String(key ?? "");
  if (str.startsWith("tv-")) {
    return { type: "tv", id: str.slice(3) };
  }
  if (str.startsWith("movie-")) {
    return { type: "movie", id: str.slice(6) };
  }
  return { type: "movie", id: str };
}

export function getMediaTitle(item) {
  return item?.title || item?.name || "Unknown";
}

export function normalizeMediaItem(item) {
  if (!item?.id) return item;

  const media_type =
    item.media_type || (item.first_air_date && !item.release_date ? "tv" : "movie");

  return {
    ...item,
    media_type,
    title: item.title || item.name,
  };
}

export function infoPath(mediaType, id) {
  const type = mediaType === "tv" ? "tv" : "movie";
  return `/info/${type}/${id}`;
}

export function ratingBarColor(rating) {
  if (rating >= 8) return "#22c55e";
  if (rating >= 6.5) return "#84cc16";
  if (rating >= 5) return "#eab308";
  if (rating >= 3) return "#f97316";
  return "#ef4444";
}

export const PIE_COLORS = [
  "#7c3aed",
  "#ec4899",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#3b82f6",
];

export function withChartColors(data) {
  return (data || []).map((entry, index) => ({
    ...entry,
    color: entry.color || PIE_COLORS[index % PIE_COLORS.length],
  }));
}

const MOVIE_TO_TV_GENRE = {
  action: "action & adventure",
  adventure: "action & adventure",
  animation: "animation",
  comedy: "comedy",
  crime: "crime",
  documentary: "documentary",
  drama: "drama",
  family: "family",
  fantasy: "sci-fi & fantasy",
  history: "war & politics",
  horror: "drama",
  music: "drama",
  mystery: "mystery",
  romance: "drama",
  "science fiction": "sci-fi & fantasy",
  thriller: "drama",
  war: "war & politics",
  western: "western",
};

export function matchTvGenre(movieGenreName, tvGenres) {
  if (!movieGenreName || !tvGenres?.length) return null;

  const normalized = movieGenreName.toLowerCase().trim();
  const mapped = MOVIE_TO_TV_GENRE[normalized] || normalized;

  return (
    tvGenres.find((g) => g.name.toLowerCase() === mapped) ||
    tvGenres.find((g) => g.name.toLowerCase().includes(normalized)) ||
    tvGenres.find((g) => normalized.includes(g.name.toLowerCase().split("&")[0].trim()))
  );
}

export function guessWatchRegion() {
  if (typeof navigator === "undefined") return "US";
  const locale = navigator.language || "en-US";
  const region = locale.split("-")[1];
  return region?.toUpperCase() || "US";
}

const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language" });

export function formatLanguageCode(code) {
  if (!code) return "";
  try {
    return LANGUAGE_NAMES.of(code) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export function isTvItem(item) {
  return item?.media_type === "tv" || (!!item?.first_air_date && !item?.release_date);
}

export function getSpokenLanguageNames(item) {
  const spoken = isTvItem(item) ? item?.languages : item?.spoken_languages;
  const names = (spoken || [])
    .map((lang) => lang.english_name || lang.name || formatLanguageCode(lang.iso_639_1))
    .filter(Boolean);
  return [...new Set(names)];
}

export function getLanguageLines(item) {
  const lines = [];

  if (item?.original_language) {
    lines.push(`Original: ${formatLanguageCode(item.original_language)}`);
  }

  const spokenNames = getSpokenLanguageNames(item);
  if (spokenNames.length) {
    lines.push(`Available in: ${spokenNames.join(", ")}`);
  }

  return lines;
}

export function getLanguageSummary(item, maxNames = 3) {
  const spokenNames = getSpokenLanguageNames(item);
  const original = item?.original_language
    ? formatLanguageCode(item.original_language)
    : "";

  if (spokenNames.length) {
    const preview = spokenNames.slice(0, maxNames).join(", ");
    const extra =
      spokenNames.length > maxNames
        ? ` +${spokenNames.length - maxNames}`
        : "";
    if (original) {
      return `${original} · ${preview}${extra}`;
    }
    return `${preview}${extra}`;
  }

  return original;
}
