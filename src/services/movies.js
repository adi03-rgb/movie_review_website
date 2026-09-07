import express from "express";
import { tmdb } from "./tmdbService.js";
import redisClient from "./redisClient.js";
const router = express.Router();

// Trending movies + TV series
router.get("/trending", async (req, res) => {
  try {
    const cachedData = await redisClient.get("movies:trending");
    if (cachedData) {
      console.log("Serving trending movies from Redis cache");
      return res.json(JSON.parse(cachedData));
    }

    const [movieRes, tvRes] = await Promise.all([
      tmdb.get("/trending/movie/week"),
      tmdb.get("/trending/tv/week"),
    ]);

    const movies = (movieRes.data.results || []).map((item) => ({
      ...item,
      media_type: "movie",
    }));
    const series = (tvRes.data.results || []).map((item) => ({
      ...item,
      media_type: "tv",
      title: item.name,
    }));

    const merged = [...movies, ...series].sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0),
    );
    
    // Cache for 1 hour (3600 seconds)
    await redisClient.setEx("movies:trending", 3600, JSON.stringify(merged));
    res.json(merged);
  } catch (err) {
    console.error("Error in trending:", err.message);
    res.status(500).json([]);
  }
});

// Upcoming movies + TV series
router.get("/upcoming", async (req, res) => {
  try {
    const cachedData = await redisClient.get("movies:upcoming");
    if (cachedData) {
      console.log("Serving upcoming movies from Redis cache");
      return res.json(JSON.parse(cachedData));
    }

    const [movieRes, tvRes] = await Promise.all([
      tmdb.get("/movie/upcoming"),
      tmdb.get("/tv/on_the_air"),
    ]);

    const movies = (movieRes.data.results || []).map((item) => ({
      ...item,
      media_type: "movie",
    }));
    const series = (tvRes.data.results || []).map((item) => ({
      ...item,
      media_type: "tv",
      title: item.name,
    }));

    const merged = [...movies, ...series].sort(
      (a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)
    );

    // Cache for 1 hour
    await redisClient.setEx("movies:upcoming", 3600, JSON.stringify(merged));
    res.json(merged);
  } catch (err) {
    console.error("Error in upcoming:", err.message);
    res.status(500).json([]);
  }
});

// Genres
router.get("/genres", async (req, res) => {
  try {
    const cachedData = await redisClient.get("movies:genres");
    if (cachedData) {
      console.log("Serving genres from Redis cache");
      return res.json(JSON.parse(cachedData));
    }

    const [movieRes, tvRes] = await Promise.all([
      tmdb.get("/genre/movie/list"),
      tmdb.get("/genre/tv/list")
    ]);
    
    // Merge and deduplicate genres
    const allGenresMap = new Map();
    movieRes.data.genres.forEach(g => allGenresMap.set(g.id, g));
    tvRes.data.genres.forEach(g => allGenresMap.set(g.id, g));
    const mergedGenres = Array.from(allGenresMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Cache genres for 24 hours (86400 seconds) since they rarely change
    await redisClient.setEx("movies:genres", 86400, JSON.stringify({ genres: mergedGenres }));
    res.json({ genres: mergedGenres });
  } catch (err) {
    console.error("Error in genres:", err.message);
    res.status(500).json({ genres: [] });
  }
});

// Movies by genre
router.get("/genre/:id", async (req, res) => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_genres: req.params.id,
        sort_by: "popularity.desc",
      },
    });
    const results = (response.data.results || []).map((item) => ({
      ...item,
      media_type: "movie",
    }));
    res.json(results);
  } catch {
    res.status(500).json([]);
  }
});

// Search movies and TV series
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const { data } = await tmdb.get("/search/multi", {
      params: { query: q },
    });

    const results = (data.results || [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => ({
        ...item,
        title: item.title || item.name,
      }));

    res.json(results);
  } catch {
    res.status(500).json([]);
  }
});



// Watch providers (streaming / rent / buy)
router.get("/:id/providers", async (req, res) => {
  try {
    const region = req.query.region || "US";
    const { data } = await tmdb.get(`/movie/${req.params.id}/watch/providers`);
    res.json({
      region,
      providers: data.results?.[region] || null,
    });
  } catch {
    res.status(500).json({ region: req.query.region || "US", providers: null });
  }
});

// Get Movie Details
router.get("/:id", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/${req.params.id}`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch details" });
  }
});

// Get Movie Cast
router.get("/:id/credits", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/${req.params.id}/credits`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

// Get Movie Trailer
router.get("/:id/trailer", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/${req.params.id}/videos`);
    const trailer = data.results.find(
      v => v.type === "Trailer" && v.site === "YouTube"
    );
    res.json(trailer || null);
  } catch {
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});

// Get Movie Reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/movie/${req.params.id}/reviews`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

export default router;
