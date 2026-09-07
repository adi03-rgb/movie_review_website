import { useEffect, useMemo, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Link } from "react-router-dom";
import { auth, db } from '../services/firebase';
import Card from '../components/Card';
import GenrePieChart from '../components/GenrePieChart';
import "./Profile.css";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { getMediaKey, parseMediaKey, infoPath, matchTvGenre } from '../utils/mediaUtils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function textSimilarity(a, b) {
  if (!a || !b) return 0;

  const clean = (t) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .filter((w) => w.length > 3);

  const wordsA = new Set(clean(a));
  const wordsB = new Set(clean(b));

  const intersection = [...wordsA].filter((w) => wordsB.has(w));

  const score = intersection.length / (wordsA.size + wordsB.size);

  return score;
}

function SortableWatchlistItem({ m, onMoveToWatched }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: m._mediaKey || m.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div className="movieRow sortableRow" ref={setNodeRef} style={style}>
      <div className="dragHandle" {...attributes} {...listeners}>
        ≡
      </div>
      <Link to={infoPath(m.media_type, m.id)} className="movieThumbWrap">
        {m.poster_path ? (
          <img className="movieThumb" src={`https://image.tmdb.org/t/p/w200${m.poster_path}`} alt="" />
        ) : null}
      </Link>
      <div className="movieMeta">
        <Link to={infoPath(m.media_type, m.id)} className="movieTitle">
          {m.title}
        </Link>
        <div className="movieSub">Saved to watchlist</div>
        <button className="moveToWatchedBtn" onClick={() => onMoveToWatched(m._mediaKey || m.id)}>
          Move to Watched
        </button>
      </div>
    </div>
  );
}

function Profile() {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || "light",
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [ratings, setRatings] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [interestedGenres, setInterestedGenres] = useState([]);

  const [watchedMovies, setWatchedMovies] = useState([]); // includes {_rating}
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [genreChart, setGenreChart] = useState([]); // recharts data
  const [topRated, setTopRated] = useState([]); // top 3

  const [upcomingInterested, setUpcomingInterested] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const watchedIds = useMemo(() => Array.from(new Set([...Object.keys(ratings || {}), ...(watched || [])])), [ratings, watched]);
  const watchlistIds = useMemo(() => watchlist || [], [watchlist]);

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setRatings({});
      setWatchlist([]);

      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      unsubscribeUser = onSnapshot(userRef, (snap) => {
        const data = snap.exists() ? snap.data() : null;
        setRatings(data?.ratings || {});
        setWatchlist(data?.watchlist || []);
        setWatched(data?.watched || []);
        setInterestedGenres(data?.interestedGenres || []);
      });
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchWatchedAndRecommendations = async () => {
      if (
        !watchedIds.length &&
        !watchlistIds.length &&
        (!interestedGenres || interestedGenres.length === 0)
      ) {
        setWatchedMovies([]);
        setWatchlistMovies([]);
        setGenreChart([]);
        setTopRated([]);
        setUpcomingInterested([]);
        setRecommendations([]);
        return;
      }

      const allIds = Array.from(new Set([...watchedIds, ...watchlistIds]));

      const movies = allIds.length
        ? await Promise.all(
            allIds.map(async (mediaKey) => {
              const { type, id } = parseMediaKey(mediaKey);
              const apiBase = type === "tv" ? `${BACKEND}/api/tv` : `${BACKEND}/api/movies`;
              const res = await fetch(`${apiBase}/${id}`);
              if (!res.ok) return null;
              const data = await res.json();
              return {
                ...data,
                media_type: type,
                title: data.title || data.name,
                _mediaKey: mediaKey,
                _rating: ratings?.[mediaKey] ?? null,
              };
            }),
          )
        : [];

      if (cancelled) return;

      const validMovies = movies.filter(Boolean);

      const watchedSet = new Set(watchedIds.map((x) => String(x)));
      const watched = validMovies.filter((m) =>
        watchedSet.has(String(m._mediaKey || m.id)),
      );
      const userTextProfile = watched
      .map((m) => m.overview || "")
      .join(" ");
      setWatchedMovies(watched);

      const watchlistSet = new Set(watchlistIds.map((x) => String(x)));
      const watchlistOnly = validMovies.filter((m) =>
        watchlistSet.has(String(m._mediaKey || m.id)),
      );
      setWatchlistMovies(watchlistOnly);

      const top3 = [...watched]
        .filter((m) => typeof m._rating === "number")
        .sort((a, b) => b._rating - a._rating)
        .slice(0, 3);
      setTopRated(top3);

      // Genre distribution from watched movies.
      const genreCountsById = {};
      watched.forEach((m) => {
        (m.genres || []).forEach((g) => {
          if (!g?.id) return;
          const key = String(g.id);
          if (!genreCountsById[key]) {
            genreCountsById[key] = { id: g.id, name: g.name, count: 0 };
          }
          genreCountsById[key].count += 1;
        });
      });

      // Merge interested genres as a baseline boost.
      (interestedGenres || []).forEach((ig) => {
        if (!ig?.id || !ig?.name) return;
        const key = String(ig.id);
        if (!genreCountsById[key]) {
          genreCountsById[key] = { id: ig.id, name: ig.name, count: 0 };
        }
        genreCountsById[key].count += 1;
      });

      const genresArr = Object.values(genreCountsById).sort(
        (a, b) => b.count - a.count,
      );
      setGenreChart(
        genresArr.map((g) => ({
          name: g.name,
          users: g.count,
          id: g.id,
        })),
      );

      const topGenreIds = genresArr.slice(0, 3).map((g) => g.id);
      const topGenreNames = genresArr.slice(0, 3).map((g) => g.name);

      if (!topGenreIds.length) {
        setUpcomingInterested([]);
        setRecommendations([]);
        return;
      }

      const tvGenresRes = await fetch(`${BACKEND}/api/tv/genres`);
      const tvGenresData = await tvGenresRes.json();
      const tvGenres = Array.isArray(tvGenresData?.genres) ? tvGenresData.genres : [];

      const fetchMoviesByGenre = async (genreId) => {
        const res = await fetch(`${BACKEND}/api/movies/genre/${genreId}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      };

      const fetchTvByGenreName = async (genreName) => {
        const tvGenre = matchTvGenre(genreName, tvGenres);
        if (!tvGenre) return [];
        const res = await fetch(`${BACKEND}/api/tv/genre/${tvGenre.id}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      };

      const [movieCandidatesByGenre, tvCandidatesByGenre] = await Promise.all([
        Promise.all(topGenreIds.map((gid) => fetchMoviesByGenre(gid))),
        Promise.all(topGenreNames.map((name) => fetchTvByGenreName(name))),
      ]);

      const candidates = [...movieCandidatesByGenre.flat(), ...tvCandidatesByGenre.flat()];
      const alreadySetForRec = new Set(
        [...watchedIds, ...watchlistIds].map((x) => String(x)),
      );
      const unique = [];
      const seen = new Set();
      for (const m of candidates) {
        if (!m?.id) continue;
        const mediaType = m.media_type === "tv" ? "tv" : "movie";
        const recKey = getMediaKey(mediaType, m.id);
        if (alreadySetForRec.has(recKey)) continue;
        if (mediaType === "movie" && alreadySetForRec.has(String(m.id))) continue;
        if (seen.has(recKey)) continue;
        seen.add(recKey);
        unique.push({
          ...m,
          media_type: mediaType,
          title: m.title || m.name,
        });
      }

const today = new Date();
const getAirDate = (item) => item.release_date || item.first_air_date;

const upcoming = unique
  .filter((m) => {
    const airDate = getAirDate(m);
    if (!airDate) return false;
    return new Date(airDate) > today;
  })
  .sort((a, b) => new Date(getAirDate(a)) - new Date(getAirDate(b)));

const scored = unique.map((item) => {
  let genreScore = 0;

  const genreIds = item.genre_ids || (item.genres || []).map((g) => g.id);
  genreIds.forEach((gid) => {
    if (topGenreIds.includes(gid)) genreScore += 1;
  });

  (item.genres || []).forEach((g) => {
    if (topGenreNames.includes(g.name)) genreScore += 1;
  });

  const textScore = textSimilarity(userTextProfile, item.overview);
  const typeBoost = item.media_type === "tv" ? 0.15 : 0;
  const finalScore = genreScore * 2 + textScore * 5 + typeBoost;

  return { ...item, score: finalScore };
});

scored.sort((a, b) => b.score - a.score);

setUpcomingInterested(upcoming.slice(0, 8));
setRecommendations(scored.slice(0, 8));
    };

    fetchWatchedAndRecommendations().catch((e) => {
      console.error("Profile fetch error:", e);
    });

    return () => {
      cancelled = true;
    };
  }, [watchedIds, ratings, watchlistIds, interestedGenres]);

  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")?.[0] ||
    "User";

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
    setTheme(next);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = watchlist.indexOf(active.id);
      const newIndex = watchlist.indexOf(over.id);
      const newWatchlist = arrayMove(watchlist, oldIndex, newIndex);
      
      setWatchlist(newWatchlist); // Optimistic UI update

      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, { watchlist: newWatchlist });
        } catch (e) {
          console.error("Failed to update watchlist order:", e);
        }
      }
    }
  };

  const handleMoveToWatched = async (mediaId) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        watched: arrayUnion(mediaId),
        watchlist: arrayRemove(mediaId)
      });
    } catch (e) {
      console.error("Failed to move to watched:", e);
    }
  };

  return (
    <div className="profileDash">
      <aside className="dashSidebar">
        <div className="sidebarBrand">
          <div className="brandCircle">P</div>
          <div className="brandText">Poptale</div>
        </div>

        <div className="sidebarBlock">
          <div className="sidebarBlockTitle">MY PROFILE</div>
          <div className="sidebarUser">
            <div className="userCircle">{displayName.slice(0, 1).toUpperCase()}</div>
            <div className="userInfo">
              <div className="userName">{displayName}</div>
              <div className="userMeta">{Object.keys(ratings || {}).length} rated</div>
            </div>
          </div>
        </div>

        <nav className="sidebarNav">
          <Link className="sidebarLink" to="/">
            Home
          </Link>
          <Link className="sidebarLink" to="/profile">
            Profile
          </Link>
          <Link className="sidebarLink" to="/dashboard">
            Explore
          </Link>
        </nav>
      </aside>

      <div className="dashMain">
        <header className="dashTopbar">
          <div className="topbarLeft">
            <div className="topbarTitle">My Profile</div>
            <div className="topbarSubtitle">Ratings, watchlist, and recommendations</div>
          </div>
          <div className="topbarRight">
            <button type="button" className="topbarBtn" onClick={toggleTheme}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button type="button" className="topbarBtn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dashStats">
          <div className="statCard">
            <div className="statLabel">Watched</div>
            <div className="statValue">{watchedMovies.length}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Watchlist</div>
            <div className="statValue">{watchlistMovies.length}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Rated movies</div>
            <div className="statValue">{Object.keys(ratings || {}).length}</div>
          </div>
        </section>

        <main className="dashContent">
          <div className="dashGrid">
            <div className="dashCol">
              <div className="dashCard">
                <h3 className="dashCardTitle">Your genre chart</h3>
                {genreChart.length ? (
                  <div className="chartRow">
                    <GenrePieChart
                      data={genreChart.map((g) => {
                        const total =
                          genreChart.reduce((sum, x) => sum + x.users, 0) || 1;
                        return {
                          name: g.name,
                          users: Math.round((g.users / total) * 100),
                        };
                      })}
                      title="Your genre mix"
                      subtitle="Based on what you've rated and your interested genres"
                      height={240}
                    />
                    <div className="topGenres">
                      <div className="chipTitle">Interested genres</div>
                      <div className="chipRow">
                        {genreChart.slice(0, 4).map((g) => (
                          <span key={g.id} className="chip">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="emptyState">
                    Rate a few movies in <Link to="/">Info</Link> to see your chart.
                  </div>
                )}
              </div>

              <div className="dashCard">
                <h3 className="dashCardTitle">Top 3 highest rated</h3>
                {topRated.length ? (
                  <div className="topRatedList">
                    {topRated.map((m) => (
                      <div className="topRatedItem" key={m._mediaKey || m.id}>
                        <Link
                          to={infoPath(m.media_type, m.id)}
                          className="topRatedLink"
                        >
                          {m.title}
                        </Link>
                        <span className="ratingPill">{m._rating}/5</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="emptyState">No ratings yet.</div>
                )}
              </div>
            </div>

            <div className="dashCol">
              <div className="dashCard">
                <h3 className="dashCardTitle">Watched movies</h3>
                {watchedMovies.length ? (
                  <div className="movieList">
                    {watchedMovies
                      .slice()
                      .sort((a, b) => b._rating - a._rating)
                      .map((m) => (
                        <div className="movieRow" key={m._mediaKey || m.id}>
                          <Link
                            to={infoPath(m.media_type, m.id)}
                            className="movieThumbWrap"
                          >
                            {m.poster_path ? (
                              <img
                                className="movieThumb"
                                src={`https://image.tmdb.org/t/p/w200${m.poster_path}`}
                                alt=""
                              />
                            ) : null}
                          </Link>
                          <div className="movieMeta">
                            <Link
                              to={infoPath(m.media_type, m.id)}
                              className="movieTitle"
                            >
                              {m.title}
                            </Link>
                            <div className="movieSub">
                              {m._rating ? (
                                <>Your rating: <strong>{m._rating}/5</strong></>
                              ) : (
                                <>Watched</>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="emptyState">
                    Add a rating in the movie info page to populate this list.
                  </div>
                )}
              </div>

              <div className="dashCard">
                <h3 className="dashCardTitle">Your watchlist</h3>
                {watchlistMovies.length ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={watchlist.map(String)} strategy={verticalListSortingStrategy}>
                      <div className="movieList">
                        {watchlist.map((id) => {
                          const m = watchlistMovies.find(wm => (wm._mediaKey || String(wm.id)) === String(id));
                          if (!m) return null;
                          return <SortableWatchlistItem key={m._mediaKey || m.id} m={m} onMoveToWatched={handleMoveToWatched} />;
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="emptyState">
                    Add movies from the Info page watchlist.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashGridSecondary">

            <div className="dashCard colSpan2">
              <h3 className="dashCardTitle">Recommendations for you</h3>
              <p className="dashCardHint">Movies and TV series picked from your top genres</p>
              {recommendations.length ? (
                <div className="cardCarousel">
                  {recommendations.map((m) => (
                    <Card key={getMediaKey(m.media_type, m.id)} movie={m} />
                  ))}
                </div>
              ) : (
                <div className="emptyState">No recommendations yet.</div>
              )}
            </div>

                        <div className="dashCard colSpan2">
              <h3 className="dashCardTitle">Upcoming interested titles</h3>
              {upcomingInterested.length ? (
                <div className="cardCarousel">
                  {upcomingInterested.map((m) => (
                    <Card key={getMediaKey(m.media_type, m.id)} movie={m} />
                  ))}
                </div>
              ) : (
                <div className="emptyState">
                  Your upcoming picks will show after you rate movies.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
