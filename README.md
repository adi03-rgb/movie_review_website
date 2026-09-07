# 🍿 POPTALE

<p align="center">
  <img src="public/pp.gif" alt="Poptale Logo" width="120" />
</p>

<p align="center">
  <b>Entertainment isn't just content — it's a tale worth popping into.</b>
</p>

<p align="center">
  <a href="#-live-demo">🚀 Live Demo</a> •
  <a href="#-why-poptale">✨ Why Poptale</a> •
  <a href="#-features">🔥 Features</a> •
  <a href="#%EF%B8%8F-tech-stack">🛠️ Tech Stack</a> •
  <a href="#-architecture">📐 Architecture</a> •
  <a href="#-local-development">💻 Local Setup</a>
</p>

---

## 🚀 Live Demo

- 🌐 **Live Website:** [Launch Poptale](https://your-poptale-url.vercel.app) *(Update with your Vercel URL)*
- ⚡ **Backend API:** [API Health](https://your-backend-url.onrender.com) *(Update with your Render URL)*

---

## ✨ Why Poptale?

Most entertainment platforms overwhelm users with cold 1-to-10 ratings, convoluted algorithms, and endless scrolling. 

**POPTALE** turns browsing into real discovery:
- **Clear Watchability Ratings:** We replace confusing numbers with intuitive categories (*Go For It!!!*, *Watchable*, *Timepass*, *Skip*).
- **Reddit Community Discussions:** Every title links directly to live Reddit threads and official discussion megathreads.
- **Sentiment Analysis:** We process written reviews using Natural Language Processing to extract emotional consensus and highlight pros & cons.
- **Personalized Profiles:** Build your personal watchlist, track watched titles, and review your dynamic genre breakdown.

---

## 🔥 Key Features

### 🎯 Intuitive "Watchability" Ratings
Instead of guessing whether a 6.8/10 is worth your evening, POPTALE combines TMDB scores and user sentiment to categorize titles:
- **Go For It!!!** — Outstanding cinema, absolute must-watch.
- **Watchable** — Solid entertainment that delivers on its premise.
- **Timepass** — Fun, casual viewing when you just want to relax.
- **Skip** — Save your time for something better.

### 💬 Deep Reddit Discussion Links
Movies are meant to be discussed. Every movie and series on Poptale links straight to its dedicated Reddit discussions and r/movies megathreads for instant access to fan theories, hidden details, and post-credits breakdowns.

### 🧠 Sentiment Analysis & Review Summarization
Using AFINN-based Natural Language Processing, POPTALE analyzes community and TMDB reviews to score emotional consensus. It automatically highlights community thoughts across:
- **Story & Writing**
- **Acting & Performance**
- **Direction & Cinematography**
- **Pacing & Visual Effects (VFX)**

### 📊 Audience-Driven Genre Pie Charts
Studio tags don't always capture the real vibe. Our dynamic Recharts visualization maps what genres audiences *actually* experienced based on sentiment and keyword occurrence in reviews.

### ⚡ Blazing-Fast Caching with Redis
Trending titles, upcoming releases, and genres are cached with Upstash Redis, eliminating API latency and rate limits for near-instant page loads.

### 👤 Profile & Personalized Watchlists
- Real-time user profile sync backed by **Firebase Auth & Firestore**.
- Keep track of what you've watched, rate your favorites, and build your queue.
- Tailored genre recommendations that adapt as your taste evolves.

---

## 🛠️ Tech Stack

```
Frontend (Vercel)         Backend (Render)             Data & Cache Layer
┌─────────────────┐       ┌────────────────────┐       ┌─────────────────────┐
│  React 19       │ ───▶  │  Node.js / Express │ ───▶  │  TMDB API           │
│  Vite           │       │  REST API Gateway  │       │  Upstash Redis      │
│  Framer Motion  │       │  Dynamic Port Env  │       │  Firebase Firestore │
│  Recharts       │       └────────────────────┘       │  Firebase Auth      │
└─────────────────┘                                    └─────────────────────┘
```

- **Frontend:** React 19, Vite, React Router 7, Framer Motion, Recharts
- **Styling:** Custom CSS with Glassmorphism, Responsive CSS Grid/Flexbox, Dark Mode
- **Backend:** Node.js, Express 5
- **NLP:** Sentiment (AFINN-based emotion extraction)
- **Database & Auth:** Firebase Firestore, Firebase Authentication
- **Caching:** Upstash Redis (High-speed caching for TMDB queries and genre payloads)

---

## 📐 Architecture & Production Ready

- **Dynamic Environment Routing:** Decoupled frontend build using `import.meta.env.VITE_BACKEND_URL` for seamless local-to-cloud switching.
- **Zero-Downtime Cache:** Trending lists and genre catalogs are cached in Redis to minimize third-party API rate limits and deliver snappy responses.
- **Production Hardened:** Standard ES modules (`"type": "module"`), production startup scripts (`npm start`), and dynamic port binding (`process.env.PORT`).

---

## 💻 Local Development

Follow these steps to run Poptale locally:

### 1. Clone the repository
```bash
git clone https://github.com/adi03-rgb/movie_review_website.git
cd movie_review_website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root folder:

```env
# Server
PORT=5000

# TMDB API
TMDB_API_KEY=your_tmdb_api_key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Frontend (Firebase & Backend URL)
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development servers
In terminal 1 (Backend):
```bash
npm run server
```

In terminal 2 (Frontend):
```bash
npm run dev
```

Open `http://localhost:5173` in your browser!

---

## 📄 License

This project is licensed under the **MIT License**.
