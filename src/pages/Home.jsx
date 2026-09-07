import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from '../components/Card';
import SkeletonCard from '../components/SkeletonCard';
import "./Home.css";
import { motion as Motion } from 'framer-motion';

const Home = () => {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingGrid, setIsLoadingGrid] = useState(true);

  // Fetch genres
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/genres`)
      .then(res => res.json())
      .then(data => setGenres(Array.isArray(data?.genres) ? data.genres : []))
      .catch(err => console.error(err))
  }, [])

  // Fetch initial movies (upcoming, trending, default genre view)
  useEffect(() => {
    setIsLoadingUpcoming(true);
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/upcoming`)
      .then(res => res.json())
      .then(data => {
        setUpcomingMovies(Array.isArray(data) ? data.slice(0, 10) : []);
        setIsLoadingUpcoming(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingUpcoming(false);
      });

    setIsLoadingTrending(true);
    setIsLoadingGrid(true);
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/trending`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setTrendingMovies(arr.slice(0, 10));
        setMovies(arr); // Default grid view is trending
        setIsLoadingTrending(false);
        setIsLoadingGrid(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingTrending(false);
        setIsLoadingGrid(false);
      });
  }, []);

  // Fetch movies by genre
  const fetchByGenre = (id) => {
    setActiveGenre(id);
    setIsLoadingGrid(true);

    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/genre/${id}`)
      .then(res => res.json())
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
        setIsLoadingGrid(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingGrid(false);
      });
  }

  // Reset
  const fetchAll = () => {
    setActiveGenre(null);
    setIsLoadingGrid(true);
    
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/trending`)
      .then(res => res.json())
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
        setIsLoadingGrid(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingGrid(false);
      });
  };

  const heroMovie = trendingMovies.length > 0 ? trendingMovies[0] : null;

  return (
    <div className="home">
      {heroMovie && (
        <div 
          className="heroBanner" 
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})` }}
        >
          <div className="heroOverlay">
            <Motion.div 
              className="heroContent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="heroTitle">{heroMovie.title || heroMovie.name}</h1>
              <p className="heroOverview">{heroMovie.overview}</p>
              <Link to={`/info/${heroMovie.media_type || "movie"}/${heroMovie.id}`} className="heroBtn">
                View Details
              </Link>
            </Motion.div>
          </div>
        </div>
      )}

      <div className="discover">
        <h3>Discover</h3>
        <p>Browse movies &amp; series by genre and discover what’s trending right now.</p>
      </div>

      {(isLoadingUpcoming || upcomingMovies.length > 0) && (
        <div className="horizontal-section">
          <h4 className="section-title">Upcoming Movies &amp; Shows</h4>
          <div className="card-carousel">
            {isLoadingUpcoming ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonCard key={`skel-up-${idx}`} />
              ))
            ) : (
              upcomingMovies.map((movie) => (
                <Card key={`upcoming-${movie.id}`} movie={movie} />
              ))
            )}
          </div>
        </div>
      )}

      {(isLoadingTrending || trendingMovies.length > 0) && (
        <div className="horizontal-section">
          <h4 className="section-title">Trending Movies &amp; Shows</h4>
          <div className="card-carousel">
            {isLoadingTrending ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonCard key={`skel-tr-${idx}`} />
              ))
            ) : (
              trendingMovies.map((movie) => (
                <Card key={`trending-${movie.id}`} movie={movie} />
              ))
            )}
          </div>
        </div>
      )}

      {genres.length > 0 && (
        <>
          <div className="genre-section-header">
            <h4 className="section-title">Explore by Genre</h4>
          </div>

          <div className="genre-bar">
            <button
              className={!activeGenre ? "active" : ""}
              onClick={fetchAll}
            >
              All
            </button>

            {genres.map(g => (
              <button
                key={g.id}
                className={activeGenre === g.id ? "active" : ""}
                onClick={() => fetchByGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="movie-grid">
        {isLoadingGrid ? (
          Array.from({ length: 10 }).map((_, idx) => (
            <SkeletonCard key={`skel-grid-${idx}`} />
          ))
        ) : (
          movies.map((movie) => (
            <Motion.div
              key={`${movie.media_type || "movie"}-${movie.id}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <Card key={movie.id} movie={movie} />
            </Motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
