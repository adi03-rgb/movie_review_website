import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
console.log("TMDB_API_KEY length:", TMDB_API_KEY ? TMDB_API_KEY.length : 'UNDEFINED');
const BASE_URL = "https://api.themoviedb.org/3";

export const tmdb = axios.create({
  baseURL: BASE_URL,
  timeout: 3000,
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,
    "Content-Type": "application/json;charset=utf-8"
  }
});
