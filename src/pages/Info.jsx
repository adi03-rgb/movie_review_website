import { useParams, Link } from "react-router-dom"
import GenrePieChart from '../components/GenrePieChart'
import WatchProviders from '../components/WatchProviders'
import { useState, useEffect, useMemo } from "react"
import "./Info.css"
import { doc, setDoc, arrayUnion, arrayRemove, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from '../services/firebase';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { getSentimentDelta } from '../utils/sentimentUtils';
import {
  getMediaKey,
  getMediaTitle,
  ratingBarColor,
  guessWatchRegion,
  getLanguageLines,
} from '../utils/mediaUtils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const CAST_IMG_BASE = "https://image.tmdb.org/t/p/w185";

const getDisplayName = (user) =>
  user?.displayName || user?.email?.split("@")?.[0] || "User";

const formatCommentDate = (value) => {
  if (!value) return "";
  const date =
    value?.toDate?.() ||
    (typeof value === "string" ? new Date(value) : new Date(value));
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

function CommentAvatar({ name, photo }) {
  if (photo) {
    return <img src={photo} alt="" className="ytAvatarImg" />;
  }

  const initial = (name || "U").charAt(0).toUpperCase();
  return <div className="ytAvatarFallback">{initial}</div>;
}

function CastAvatar({ name, photo }) {
  if (photo) {
    return (
      <img
        src={`${CAST_IMG_BASE}${photo}`}
        alt={name}
        className="castPhoto"
        loading="lazy"
      />
    );
  }

  const initial = (name || "?").charAt(0).toUpperCase();
  return <div className="castPhotoFallback">{initial}</div>;
}

function EpisodeRatingsGraph({ seasons, seriesId, seriesRating, voteCount }) {
  const playableSeasons = (seasons || []).filter((s) => s.season_number > 0);
  const [selectedSeason, setSelectedSeason] = useState(
    () => playableSeasons[0]?.season_number ?? 1,
  );
  const [seasonData, setSeasonData] = useState({
    season: null,
    episodes: [],
    loading: true,
  });

  const activeSeason = playableSeasons.some(
    (s) => s.season_number === selectedSeason,
  )
    ? selectedSeason
    : playableSeasons[0]?.season_number ?? 1;

  useEffect(() => {
    if (!seriesId || !activeSeason) return;

    let cancelled = false;

    fetch(`${BACKEND}/api/tv/${seriesId}/season/${activeSeason}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSeasonData({
            season: activeSeason,
            episodes: (data.episodes || []).filter((ep) => ep.episode_number > 0),
            loading: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeasonData({ season: activeSeason, episodes: [], loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [seriesId, activeSeason]);

  const loadingSeason = seasonData.season !== activeSeason;
  const episodes =
    seasonData.season === activeSeason ? seasonData.episodes : [];

  const ratedEpisodes = episodes.filter((ep) => ep.vote_average > 0);
  const seasonAvg =
    ratedEpisodes.length > 0
      ? (
          ratedEpisodes.reduce((sum, ep) => sum + ep.vote_average, 0) /
          ratedEpisodes.length
        ).toFixed(1)
      : "N/A";

  const sortedByRating = [...ratedEpisodes].sort(
    (a, b) => b.vote_average - a.vote_average,
  );
  const topEpisodes = sortedByRating.slice(0, 3);
  const lowEpisodes = [...ratedEpisodes]
    .sort((a, b) => a.vote_average - b.vote_average)
    .slice(0, 3);

  const maxRating = Math.max(...ratedEpisodes.map((ep) => ep.vote_average), 10);

  return (
    <section className="episodeGraphSection">
      <div className="episodeGraphHeader">
        <div>
          <h2 className="episodeGraphTitle">Episode ratings</h2>
          <p className="episodeGraphSubtitle">
            TMDB community scores by episode — explore highs, lows, and binge peaks
          </p>
        </div>
        <div className="episodeGraphMeta">
          <span className="episodeGraphScore">
            {seriesRating?.toFixed?.(1) ?? seriesRating ?? "N/A"}
          </span>
          <span className="episodeGraphVotes">
            {voteCount ? `${voteCount.toLocaleString()} votes` : "No votes yet"}
          </span>
        </div>
      </div>

      <div className="seasonTabs" role="tablist" aria-label="Select season">
        {playableSeasons.map((season) => (
          <button
            key={season.season_number}
            type="button"
            role="tab"
            aria-selected={activeSeason === season.season_number}
            className={`seasonTab ${activeSeason === season.season_number ? "active" : ""}`}
            onClick={() => setSelectedSeason(season.season_number)}
          >
            {season.name || `Season ${season.season_number}`}
          </button>
        ))}
      </div>

      <div className="episodeGraphStats">
        <div className="episodeStat">
          <span>Season average</span>
          <strong>{seasonAvg}</strong>
        </div>
        <div className="episodeStat">
          <span>Episodes</span>
          <strong>{episodes.length}</strong>
        </div>
      </div>

      {loadingSeason ? (
        <div className="episodeGraphLoading">Loading episode ratings...</div>
      ) : ratedEpisodes.length ? (
        <>
          <div className="episodeSkyline" aria-label="Episode rating chart">
            <div className="episodeSkylineAxis">
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            <div className="episodeBars">
              {ratedEpisodes.map((ep) => {
                const heightPct = Math.max(6, (ep.vote_average / maxRating) * 100);
                return (
                  <div
                    key={ep.id || ep.episode_number}
                    className="episodeBarCol"
                    title={`E${ep.episode_number}: ${ep.name} — ${ep.vote_average.toFixed(1)}`}
                  >
                    <div className="episodeBarWrap">
                      <div
                        className="episodeBar"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: ratingBarColor(ep.vote_average),
                        }}
                      />
                    </div>
                    <span className="episodeNum">{ep.episode_number}</span>
                    <span className="episodeRatingLabel">
                      {ep.vote_average.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="episodeHighlights">
            <div className="episodeHighlightCol">
              <h3>Highest rated</h3>
              <ul>
                {topEpisodes.map((ep) => (
                  <li key={`top-${ep.episode_number}`}>
                    <span className="epTag">E{ep.episode_number}</span>
                    <span className="epName">{ep.name}</span>
                    <strong>{ep.vote_average.toFixed(1)}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="episodeHighlightCol low">
              <h3>Lowest rated</h3>
              <ul>
                {lowEpisodes.map((ep) => (
                  <li key={`low-${ep.episode_number}`}>
                    <span className="epTag">E{ep.episode_number}</span>
                    <span className="epName">{ep.name}</span>
                    <strong>{ep.vote_average.toFixed(1)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="episodeGraphEmpty">No episode ratings for this season.</div>
      )}
    </section>
  );
}

const Info = () => {
  const { mediaType: routeMediaType, id: routeId, info } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [firebaseComments, setFirebaseComments] = useState([]);
  const [tmdbComments, setTmdbComments] = useState([]);
  const comments = [...tmdbComments, ...firebaseComments];
  const [trailerKey, setTrailerKey] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [watchRegion, setWatchRegion] = useState(() => guessWatchRegion());
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [userWatched, setUserWatched] = useState([]);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const pageSize = 5;

  const resolvedType =
    routeMediaType === "tv" || routeMediaType === "movie"
      ? routeMediaType
      : "movie";
  const resolvedId = routeId || info;
  const isTv = resolvedType === "tv";
  const mediaDocKey = getMediaKey(resolvedType, resolvedId);

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserRatings({});
      setUserWatchlist([]);
      setUserWatched([]);

      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userRef, (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setUserRatings(data?.ratings || {});
        setUserWatchlist(data?.watchlist || []);
        setUserWatched(data?.watched || []);
      });
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      unsubscribeAuth();
    };
  }, []);


useEffect(() => {
  if (!movie) return;

  const movieRef = doc(db, "movies", mediaDocKey);

  const unsubscribe = onSnapshot(movieRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setFirebaseComments(data.comments || []);
    }
  });

  return () => unsubscribe();
}, [movie, mediaDocKey]);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!comment.trim() || !movie || !currentUser) return;

  setLoading(true);

  const commentObject = {
    text: comment.trim(),
    createdAt: new Date().toISOString(),
    userId: currentUser.uid,
    userName: getDisplayName(currentUser),
    userPhoto: currentUser.photoURL || "",
  };

  try {
    await setDoc(
      doc(db, "movies", mediaDocKey),
      {
        title: getMediaTitle(movie),
        mediaType: resolvedType,
        comments: arrayUnion(commentObject),
      },
      { merge: true },
    );

    setComment("");
  } catch (error) {
    console.error("Error adding comment:", error);
  }

  setLoading(false);
};

  const genreKeywords = {
    Action: ["fight", "explosion", "battle", "action", "weapon", "stunt", "hero", "combat", "martial arts", "chase"],
    Mystery: ["mystery", "clue", "detective", "unknown", "twist", "secret", "whodunit", "investigation"],
    Comedy: ["funny", "laugh", "joke", "humor", "hilarious", "comedy", "gag", "sitcom", "amusing"],
    Drama: ["emotional", "story", "relationship", "character", "drama", "sad", "touching", "tearjerker", "tragedy"],
    "Science Fiction": ["space", "futuristic", "technology", "android", "sci-fi", "alien", "future", "cyberpunk", "time travel"],
    Thriller: ["suspense", "thrill", "tension", "edge", "intense", "gripping", "nail-biting", "psycho"],
    Horror: ["horror", "scary", "terror", "creepy", "fear", "jump scare", "gore", "slasher", "monster"],
    Adventure: ["adventure", "journey", "quest", "explore", "world", "expedition", "treasure"],
    Fantasy: ["fantasy", "magic", "myth", "creature", "spell", "dragon", "wizard", "elf"],
    Animation: ["animation", "animated", "cartoon", "visual", "art", "anime", "cg"],
    Romance: ["romance", "love", "couple", "kiss", "heart", "chemistry", "date"],
    Family: ["family", "kids", "children", "wholesome", "fun", "parent", "sibling"],
    Crime: ["crime", "police", "murder", "heist", "gang", "mafia", "detective"],
    Documentary: ["documentary", "real", "truth", "facts", "history", "biography", "doc"],
    History: ["history", "historical", "period", "past", "century", "ancient", "war"],
    Music: ["music", "song", "singing", "dance", "musical", "concert", "band"],
    War: ["war", "soldier", "army", "battlefield", "combat", "military", "wwii"],
    Western: ["western", "cowboy", "desert", "outlaw", "saloon", "gun", "horse"],
    Sports: ["sport", "game", "athlete", "team", "tournament", "match", "boxing", "football"],
    Supernatural: ["supernatural", "ghost", "spirit", "demon", "paranormal", "haunted"]
  };

  const computeGenreSharesFromComments = (officialGenres, commentsList) => {
    if (!officialGenres?.length) return [];

    // Baseline makes sure each official genre always has a non-zero slice.
    const values = Object.fromEntries(officialGenres.map((g) => [g, 1]));
    const allAvailableGenres = Object.keys(genreKeywords);

    commentsList.forEach((c) => {
      const text = c?.text || "";
      const parts = text.split(/but|and|,/i);

      parts.forEach((part) => {
        const delta = getSentimentDelta(part);
        if (delta === 0) return;

        let t = part.toLowerCase();

        const matchedGenres = allAvailableGenres.filter((genre) =>
          genreKeywords[genre]?.some((keyword) => t.includes(keyword))
        );

        if (!matchedGenres.length) return;

        const deltaSign = delta > 0 ? 1 : -1;
        const magnitude = Math.abs(delta);

        matchedGenres.forEach((genre) => {
          if (values[genre] === undefined) {
            // New genre discovered from comments, initialize it at 0
            values[genre] = 0;
          }
          values[genre] += deltaSign * magnitude;
        });
      });
    });

    const clamped = Object.fromEntries(
      Object.entries(values)
        .filter(([k, v]) => v > 0) // Only keep genres with a positive score
        .map(([k, v]) => [k, Math.max(0.1, v)])
    );
    
    const total = Object.values(clamped).reduce((a, b) => a + b, 0);

    if (!total) {
      const equal = Math.round((100 / officialGenres.length) * 100) / 100;
      return officialGenres.map((g) => ({ name: g, users: equal }));
    }

    return Object.keys(clamped).map((g) => ({
      name: g,
      users: Math.round((clamped[g] / total) * 100),
    }));
  };

  const genreData = movie?.genres?.length
    ? computeGenreSharesFromComments(
        movie.genres.map((g) => g.name),
        comments
      )
    : [];

  const movieIdStr = movie ? mediaDocKey : "";
  const userRatingForMovie =
    currentUser && movieIdStr ? userRatings?.[movieIdStr] ?? null : null;
  const isInWatchlist =
    currentUser && movieIdStr ? userWatchlist?.includes(movieIdStr) : false;
  const isInWatched =
    currentUser && movieIdStr ? userWatched?.includes(movieIdStr) : false;

  const communityGoodness = (() => {
    // Derive a 0..100 "goodness" score from comment sentiment deltas.
    let pos = 0;
    let neg = 0;
    let total = 0;

    comments.forEach((c) => {
      const delta = getSentimentDelta(c?.text || "");
      if (delta === 0) return;
      const abs = Math.abs(delta);
      total += abs;
      if (delta > 0) pos += abs;
      else neg += abs;
    });

    if (total === 0) return 50;

    const normalized = (pos - neg) / total; // -1 .. 1
    const pct = Math.round(((normalized + 1) / 2) * 100);
    return Math.max(0, Math.min(100, pct));
  })();

  const aspectKeywords = useMemo(
    () => ({
      Story: ["story", "plot", "script", "ending", "writing", "character"],
      "Pacing/Length": ["pacing", "slow", "too slow", "length", "dragging", "runtime"],
      "VFX/Effects": [
        "vfx",
        "effects",
        "cgi",
        "visual effects",
        "graphics",
        "animation",
        "special effects",
        "makeup",
      ],
      Acting: ["acting", "performance", "cast", "actors"],
      Cinematography: ["cinematography", "camera", "shots", "visuals"],
      "Music/Sound": ["music", "sound", "score", "bgm", "soundtrack"],
      Action: ["action", "fight", "stunt", "explosion", "combat", "thrill", "choreography"],
      Horror: ["horror", "scary", "scare", "creepy", "terrifying", "fear", "gore", "jump scare"],
      Comedy: ["comedy", "funny", "humor", "joke", "laugh", "hilarious", "gag"],
      Romance: ["romance", "love", "chemistry", "romantic"],
      "Sci-Fi/Fantasy": ["sci-fi", "fantasy", "magic", "alien", "space", "future"],
      "Overall Experience": ["enjoy", "love", "hate", "excellent", "awful", "boring", "awesome"],
    }),
    [],
  );

  const reviewSummary = useMemo(() => {
    const aspectNames = Object.keys(aspectKeywords);
    const pos = Object.fromEntries(aspectNames.map((a) => [a, 0]));
    const neg = Object.fromEntries(aspectNames.map((a) => [a, 0]));
    
    const posQuotes = {};
    const negQuotes = {};

    comments.forEach((c) => {
      const text = c?.text || "";
      const sentences = text.split(/[.!?]+/);

      sentences.forEach((sentence) => {
        const clean = sentence.trim();
        if (!clean || clean.length < 10) return;

        const delta = getSentimentDelta(clean);
        if (delta === 0) return;

        const t = clean.toLowerCase();
        const matched = aspectNames.filter((aspect) => {
          const keywords = aspectKeywords[aspect] || [];
          return keywords.some((keyword) => t.includes(keyword.toLowerCase()));
        });

        if (!matched.length) {
          matched.push("Overall Experience");
        }

        const deltaSign = delta > 0 ? 1 : -1;
        const magnitude = Math.abs(delta);

        matched.forEach((g) => {
          if (deltaSign > 0) {
            pos[g] += magnitude;
            if (!posQuotes[g] || magnitude > (posQuotes[g].score || 0)) {
              posQuotes[g] = { text: clean, score: magnitude };
            }
          } else {
            neg[g] += magnitude;
            if (!negQuotes[g] || magnitude > (negQuotes[g].score || 0)) {
              negQuotes[g] = { text: clean, score: magnitude };
            }
          }
        });
      });
    });

    const finalPos = {};
    const finalNeg = {};

    aspectNames.forEach((aspect) => {
      const p = pos[aspect];
      const n = neg[aspect];

      if (p > n) {
        finalPos[aspect] = p - n;
      } else if (n > p) {
        finalNeg[aspect] = n - p;
      }
    });

    const positiveAspects = Object.entries(finalPos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => ({ aspect: g, quote: posQuotes[g]?.text }));

    const negativeAspects = Object.entries(finalNeg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => ({ aspect: g, quote: negQuotes[g]?.text }));

    return { positive: positiveAspects, negative: negativeAspects };
  }, [comments, aspectKeywords]);

  const goodnessLabel =
    communityGoodness >= 75
      ? "Great vibes"
      : communityGoodness >= 55
        ? "Mostly positive"
        : communityGoodness >= 40
          ? "Mixed"
          : "Not great";

  const saveRating = async (ratingValue) => {
    if (!currentUser || !movieIdStr) return;

    setUserActionLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userRef,
        {
          ratings: {
            [movieIdStr]: ratingValue,
          },
          watched: arrayUnion(movieIdStr),
          watchlist: arrayRemove(movieIdStr)
        },
        { merge: true },
      );

      const movieDocRef = doc(db, "movies", mediaDocKey);
      await setDoc(
        movieDocRef,
        {
          ratings: {
            [currentUser.uid]: ratingValue,
          },
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error saving rating:", e);
      alert("Could not save rating. Please try again.");
    } finally {
      setUserActionLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!currentUser || !movieIdStr) return;

    setUserActionLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);

      if (userRatingForMovie) {
        // If it's already rated, it belongs in watched. The button can just put it there.
        await setDoc(userRef, {
          watched: isInWatched ? arrayRemove(movieIdStr) : arrayUnion(movieIdStr),
          watchlist: arrayRemove(movieIdStr)
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          watchlist: isInWatchlist ? arrayRemove(movieIdStr) : arrayUnion(movieIdStr),
        }, { merge: true });
      }
    } catch (e) {
      console.error("Error toggling list:", e);
      alert("Could not update list. Please try again.");
    } finally {
      setUserActionLoading(false);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    const aTime = new Date(a?.createdAt?.toDate?.() || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt?.toDate?.() || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const totalCommentPages = Math.max(1, Math.ceil(sortedComments.length / pageSize));
  const safeCommentPage = Math.min(commentPage, totalCommentPages);
  const pageStart = (safeCommentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const visibleComments = sortedComments.slice(pageStart, pageEnd);

  useEffect(() => {
    if (!resolvedId) return;

    setMovie(null);
    setCast([]);
    setTrailerKey(null);
    setWatchProviders(null);
    setCommentPage(1);
    setTmdbComments([]);

    const apiBase = isTv ? `${BACKEND}/api/tv` : `${BACKEND}/api/movies`;
    const region = guessWatchRegion();
    setWatchRegion(region);

    fetch(`${apiBase}/${resolvedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setMovie(data);
      })
      .catch(() => setMovie(null));

    fetch(`${apiBase}/${resolvedId}/credits`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.cast)) setCast(data.cast.slice(0, 10));
      })
      .catch(() => setCast([]));

    fetch(`${apiBase}/${resolvedId}/trailer`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.key) setTrailerKey(data.key);
      })
      .catch(() => setTrailerKey(null));

    fetch(`${apiBase}/${resolvedId}/providers?region=${region}`)
      .then((res) => res.json())
      .then((data) => {
        setWatchProviders(data?.providers || null);
        if (data?.region) setWatchRegion(data.region);
      })
      .catch(() => setWatchProviders(null));

    fetch(`${apiBase}/${resolvedId}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data?.results || []).map((r) => ({
          text: r.content,
          createdAt: r.created_at,
          userName: r.author,
          userId: `tmdb-${r.id}`,
          isTmdb: true,
          userPhoto: r.author_details?.avatar_path 
            ? (r.author_details.avatar_path.startsWith('/') 
                ? `https://image.tmdb.org/t/p/w45${r.author_details.avatar_path}` 
                : r.author_details.avatar_path) 
            : null
        }));
        setTmdbComments(mapped);
      })
      .catch(() => setTmdbComments([]));
  }, [resolvedId, isTv]);

  if (!movie) return <div className="loading">Loading...</div>;

  const displayTitle = getMediaTitle(movie);
  const releaseLabel = isTv ? movie.first_air_date : movie.release_date;
  const runtimeLabel = isTv
    ? movie.episode_run_time?.length
      ? `${movie.episode_run_time[0]} mins / ep`
      : "N/A"
    : `${movie.runtime || "N/A"} mins`;
  const seasonsLabel = isTv ? movie.number_of_seasons : null;

  const languageLabels = getLanguageLines(movie);

  return (
    <div
      className="whole"
      style={{
        backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
      }}
    >
      <div className="con">

        {trailerKey && (
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}`}
            className="frame"
            allowFullScreen
            title="Trailer"
          />
        )}

        <div className="img">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt=""
          />
        </div>

        <div className="conin">
          <p className="tt">{displayTitle}</p>
          {isTv && <span className="seriesBadge">TV Series</span>}
          <p className="plot">{movie.overview}</p>
          <div className="ce">
            <h2>PG: </h2>{movie.adult?"Yes":"No"}
            <h2>{isTv ? "First aired:" : "Release Date:"}</h2> {releaseLabel || "N/A"}
          <h2>{isTv ? "Episode runtime:" : "Runtime:"}</h2> {runtimeLabel}
          {isTv && (
            <>
              <h2>Seasons:</h2> {seasonsLabel ?? "N/A"}
              <h2>Episodes:</h2> {movie.number_of_episodes ?? "N/A"}
            </>
          )}
          <h2>Genres:</h2> {movie.genres?.map(g => g.name).join(", ") || "N/A"}
          </div>

          <div className="goodnessMeter">
            <div className="goodnessTop">
              <span>Community score</span>
              <strong>{communityGoodness}%</strong>
            </div>
            <div className="goodnessTrack" aria-label="Community score meter">
              <div
                className="goodnessFill"
                style={{
                  width: `${communityGoodness}%`,
                  backgroundColor:
                    communityGoodness >= 70
                      ? "var(--accent)"
                      : communityGoodness >= 55
                        ? "rgb(34, 197, 94)"
                        : "rgb(239, 68, 68)",
                }}
              />
            </div>
            <div className="goodnessHint">{goodnessLabel} based on comments</div>
          </div>

          <div className="infoReviewSummary">
            <h2 className="infoReviewTitle">What People Are Saying</h2>
            <div className="infoReviewGrid">
              <div className="infoReviewCol">
                <div className="infoReviewLabel positive">Positive Highlights</div>
                <ul className="infoReviewList">
                  {reviewSummary.positive.length ? (
                    reviewSummary.positive.map((item) => (
                      <li key={item.aspect}>
                        <strong>{item.aspect}</strong>
                        {item.quote && <p className="reviewQuote">"{item.quote}"</p>}
                      </li>
                    ))
                  ) : (
                    <li className="mutedItem">N/A</li>
                  )}
                </ul>
              </div>
              <div className="infoReviewCol">
                <div className="infoReviewLabel negative">Areas for Improvement</div>
                <ul className="infoReviewList">
                  {reviewSummary.negative.length ? (
                    reviewSummary.negative.map((item) => (
                      <li key={item.aspect}>
                        <strong>{item.aspect}</strong>
                        {item.quote && <p className="reviewQuote">"{item.quote}"</p>}
                      </li>
                    ))
                  ) : (
                    <li className="mutedItem">N/A</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="infoReviewSummary" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="infoReviewTitle">Reddit Discussions</h2>
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>See what the Reddit community is saying about {displayTitle}.</p>
            </div>
            <a 
              href={isTv 
                ? `https://www.reddit.com/search/?q=${encodeURIComponent(`"${displayTitle}" discussion review`)}`
                : `https://www.reddit.com/r/movies/search/?q=${encodeURIComponent(`"${displayTitle}" Official Discussion`)}&restrict_sr=1`
              } 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                backgroundColor: '#ff4500', 
                color: 'white', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              Search Reddit ↗
            </a>
          </div>

          <GenrePieChart
            data={genreData}
            title="Comment-driven genres"
            subtitle="How community comments lean across genres"
            height={260}
          />
        </div>

        <section className="availabilitySection">
          <div className="availabilityCard">
            <h2 className="availabilityTitle">Where to watch</h2>
            <p className="availabilityRegion">Showing options for {watchRegion}</p>
            <WatchProviders providers={watchProviders} region={watchRegion} />
          </div>

          <div className="availabilityCard">
            <h2 className="availabilityTitle">Languages</h2>
            {languageLabels.length ? (
              <ul className="languageList">
                {languageLabels.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="watchProvidersEmpty">Language info not available.</p>
            )}
          </div>
        </section>

        <div className="cast">
          <h2 className="castTitle">Cast</h2>
          {cast.length ? (
            <div className="castRow">
              {cast.map((c) => (
                <article key={c.id} className="castMember">
                  <CastAvatar name={c.name} photo={c.profile_path} />
                  <p className="castName">{c.name}</p>
                  <p className="castRole">{c.character}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="castEmpty">Cast info not available.</p>
          )}

          <div className="userActions">
          {currentUser ? (
            <>
              <div className="actionBlock">
                <h2 className="actionTitle">Your rating</h2>
                <div className="ratingRow" role="radiogroup" aria-label={`Rate this ${isTv ? "series" : "movie"}`}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`rateBtn ${userRatingForMovie === v ? "active" : ""}`}
                      disabled={userActionLoading}
                      onClick={() => saveRating(v)}
                      aria-checked={userRatingForMovie === v}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="actionHint">
                  {userRatingForMovie ? `Saved: ${userRatingForMovie}/5` : "Not rated yet"}
                </div>
              </div>

              <div className="actionBlock">
                <h2 className="actionTitle">List</h2>
                <button
                  type="button"
                  className={`watchBtn ${isInWatchlist || isInWatched ? "in" : ""}`}
                  disabled={userActionLoading}
                  onClick={toggleWatchlist}
                >
                  {userRatingForMovie || isInWatched 
                    ? (isInWatched ? "Remove from Watched" : "Add to Watched") 
                    : (isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist")}
                </button>
              </div>
            </>
          ) : (
            <div className="authPrompt">
              Login to rate and add this {isTv ? "series" : "movie"} to your watchlist.
            </div>
          )}
        </div>
        </div>

        {isTv && (
          <EpisodeRatingsGraph
            key={movie.id}
            seasons={movie.seasons}
            seriesId={movie.id}
            seriesRating={movie.vote_average}
            voteCount={movie.vote_count}
          />
        )}

        <section className="ytComments">
          <div className="ytCommentsHeader">
            <h2 className="ytCommentsTitle">
              {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
            </h2>
          </div>

          {currentUser ? (
            <form onSubmit={handleSubmit} className="ytComposer">
              <div className="ytAvatarWrap">
                <CommentAvatar
                  name={getDisplayName(currentUser)}
                  photo={currentUser.photoURL}
                />
              </div>
              <div className="ytComposerMain">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`ytComposerInput ${comment.trim() ? "active" : ""}`}
                  placeholder="Add a comment..."
                  rows={1}
                />
                {comment.trim() && (
                  <div className="ytComposerActions">
                    <button
                      type="button"
                      className="ytCancelBtn"
                      onClick={() => setComment("")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="ytCommentBtn"
                    >
                      {loading ? "Commenting..." : "Comment"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <p className="ytLoginPrompt">
              <Link to="/login">Sign in</Link> to leave a comment.
            </p>
          )}

          <div className="ytCommentList">
            {visibleComments.length ? (
              visibleComments.map((c, index) => {
                const authorName = c.userName || (c.userId ? "User" : "Unknown");
                return (
                  <article
                    className="ytComment"
                    key={`${c.userId || "unknown"}-${c.createdAt || index}`}
                  >
                    <div className="ytAvatarWrap">
                      <CommentAvatar name={authorName} photo={c.userPhoto} />
                    </div>
                    <div className="ytCommentBody">
                      <div className="ytCommentMeta">
                        <span className="ytCommentAuthor">{authorName}</span>
                        {c.isTmdb && <span className="tmdbBadge">via TMDB</span>}
                        <span className="ytCommentDate">
                          {formatCommentDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="ytCommentText">{c.text}</p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="ytEmptyComments">No comments yet. Be the first to share your thoughts.</p>
            )}
          </div>

          {sortedComments.length > pageSize && (
            <div className="commentPaging" aria-label="Comment pagination">
              <button
                type="button"
                disabled={commentPage <= 1}
                onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                className="pagingBtn"
              >
                Prev
              </button>
              <span className="pagingText">
                Page {safeCommentPage} of {totalCommentPages}
              </span>
              <button
                type="button"
                disabled={commentPage >= totalCommentPages}
                onClick={() =>
                  setCommentPage((p) => Math.min(totalCommentPages, p + 1))
                }
                className="pagingBtn"
              >
                Next
              </button>
            </div>
          )}
        </section>



      </div>
    </div>
  );
};

export default Info;
