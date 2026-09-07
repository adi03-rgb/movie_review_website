import express from "express";
import { tmdb } from "./tmdbService.js";
import axios from "axios";

const router = express.Router();

router.get("/trending", async (req, res) => {
  try {
    const { data } = await tmdb.get("/trending/tv/week");
    const results = (data.results || []).map((item) => ({
      ...item,
      media_type: "tv",
      title: item.name,
    }));
    res.json(results);
  } catch {
    res.status(500).json([]);
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const { data } = await tmdb.get("/search/tv", {
      params: { query: q },
    });
    const results = (data.results || []).map((item) => ({
      ...item,
      media_type: "tv",
      title: item.name,
    }));
    res.json(results);
  } catch {
    res.status(500).json([]);
  }
});

router.get("/genres", async (req, res) => {
  try {
    const { data } = await tmdb.get("/genre/tv/list");
    res.json({ genres: data.genres || [] });
  } catch {
    res.status(500).json({ genres: [] });
  }
});

router.get("/genre/:id", async (req, res) => {
  try {
    const { data } = await tmdb.get("/discover/tv", {
      params: {
        with_genres: req.params.id,
        sort_by: "popularity.desc",
      },
    });
    const results = (data.results || []).map((item) => ({
      ...item,
      media_type: "tv",
      title: item.name,
    }));
    res.json(results);
  } catch {
    res.status(500).json([]);
  }
});

router.get("/:id/providers", async (req, res) => {
  try {
    const region = req.query.region || "US";
    const { data } = await tmdb.get(`/tv/${req.params.id}/watch/providers`);
    res.json({
      region,
      providers: data.results?.[region] || null,
    });
  } catch {
    res.status(500).json({ region: req.query.region || "US", providers: null });
  }
});

router.get("/:id/season/:seasonNumber", async (req, res) => {
  try {
    const { data } = await tmdb.get(
      `/tv/${req.params.id}/season/${req.params.seasonNumber}`,
    );
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch season" });
  }
});

router.get("/:id/credits", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/tv/${req.params.id}/credits`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

router.get("/:id/trailer", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/tv/${req.params.id}/videos`);
    const trailer = data.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );
    res.json(trailer || null);
  } catch {
    res.status(500).json({ error: "Failed to fetch trailer" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/tv/${req.params.id}`);
    res.json({ ...data, media_type: "tv", title: data.name });
  } catch {
    res.status(500).json({ error: "Failed to fetch details" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const { data } = await tmdb.get(`/tv/${req.params.id}/reviews`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

export default router;
