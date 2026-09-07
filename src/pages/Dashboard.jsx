import { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import "./Dashboard.css"
import Card from '../components/Card'

import SkeletonCard from '../components/SkeletonCard'

const Dashboard = () => {
  const [tp, setTp] = useState("")
  const [movies, setMovies] = useState([])
  const [defaultMovies, setDefaultMovies] = useState([])
  const [currentp, setp] = useState(1)
  const [currentpost] = useState(12)
  const [isLoading, setIsLoading] = useState(true)

  const [filterRating, setFilterRating] = useState("All");

  // Load trending movies once
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/trending`)
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setDefaultMovies(arr)
        setMovies(arr)
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [])

  // Search movies
useEffect(() => {
  const query = tp.trim();
  if (!query) {
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  const tracker = setTimeout(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
        setp(1); // Reset page on new search
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, 400);
  return () => clearTimeout(tracker);
}, [tp]);  


  const displayedMovies = tp.trim() ? movies : defaultMovies;

  const filteredMovies = displayedMovies.filter(m => {
    if (filterRating === "All") return true;
    const avg = m.vote_average || 0;
    let typ = "Skip";
    if (avg >= 8) typ = "Go For It!!!";
    else if (avg >= 6) typ = "Watchable";
    else if (avg >= 4) typ = "Timepass";
    return typ === filterRating;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / currentpost));
  const page = Math.min(currentp, totalPages);

  const start = (page - 1) * currentpost;
  const end = start + currentpost;
  const show = filteredMovies.slice(start, end);

  return (
    <div>
      <div id="search">
        <input
          id="bar"
          placeholder="search here..........."
          type="text"
          value={tp}
          onChange={(e) => {
            setTp(e.target.value);
            setp(1);
          }}
        />
        <select 
          className="ratingFilter" 
          value={filterRating} 
          onChange={(e) => {
            setFilterRating(e.target.value);
            setp(1);
          }}
        >
          <option value="All">All Ratings</option>
          <option value="Go For It!!!">Go For It!!!</option>
          <option value="Watchable">Watchable</option>
          <option value="Timepass">Timepass</option>
          <option value="Skip">Skip</option>
        </select>
      </div>

      <div id="outp">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, idx) => (
            <SkeletonCard key={`skeleton-${idx}`} />
          ))
        ) : (
          show.map((m) => (
            <Motion.div
              key={`${m.media_type || "movie"}-${m.id}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card movie={m} />
            </Motion.div>
          ))
        )}
      </div>

      <div className="dashPaging" aria-label="Movie pagination">
        <button
          type="button"
          className="dashBtn"
          disabled={page <= 1}
          onClick={() => setp((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="dashText">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="dashBtn"
          disabled={page >= totalPages}
          onClick={() => setp((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Dashboard
