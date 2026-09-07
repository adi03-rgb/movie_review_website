# 🍿 POPTALE

**POPTALE** is a modern, dynamic web application designed for movie and TV series enthusiasts. It goes beyond standard ratings by using **sentiment analysis** to read through user reviews and automatically extract the best and worst aspects of a film or show. 

With a beautiful UI, seamless TMDB integration, and a Firebase backend, POPTALE helps you decide exactly what to watch next.


=======
>>>>>>> 93f23562c754c9a68813d82bdaa4806f6ee38f10

## Features

- **Sentiment Analysis:** The application goes beyond standard numerical ratings by performing natural language processing on written reviews. It analyzes both external TMDB reviews and local user comments to calculate an aggregated "Community Score" based on emotional tone, categorizing the overall reception into distinct tiers ranging from "Great vibes" to "Not great."
- **Review Summarization:** By evaluating the context of user reviews, the system automatically extracts the most impactful quotes and categorizes them into positive highlights (e.g., Story, Acting, Cinematography) and areas for improvement (e.g., Pacing, VFX). This provides users with a quick, qualitative summary of community consensus without needing to read hundreds of comments.
- **Comment-driven Genres:** The platform generates a dynamic pie chart that visualizes the genres the community most strongly associates with a film or show. This is calculated dynamically by cross-referencing keyword occurrences in reviews with their associated sentiment, ensuring the chart reflects the audience's actual experience rather than just the studio's official classification.
- **Smart Ratings:** Titles are automatically assigned quick-glance rating labels such as "Go For It!!!", "Watchable", "Timepass", and "Skip". These labels are dynamically calculated by merging official TMDB vote averages with localized user ratings from the platform, ensuring a balanced and trustworthy metric.
- **User Authentication:** The application features a robust and secure authentication system powered by Firebase Auth. Users can seamlessly create accounts, log in, and manage their personal profiles to interact with the platform's features.
- **Watchlist & Ratings:** Authenticated users can build their own personalized watchlists by saving movies and TV shows for later viewing. Additionally, users can submit their own custom numerical ratings for titles, which are securely stored in Firestore and actively contribute to the platform's global average metrics.

<<<<<<< HEAD
---

## 🛠️ Tech Stack
=======

## Tech Stack
>>>>>>> 93f23562c754c9a68813d82bdaa4806f6ee38f10

### Frontend
- **React (Vite):** Fast, modern component-based UI.
- **React Router:** Seamless client-side navigation.
- **Recharts:** For rendering the beautiful, dynamic genre pie charts.
- **Framer Motion:** For smooth, cinematic page and card animations.
- **Vanilla CSS:** Custom, aesthetic styling with CSS variables for theming.

### Backend & Services
- **Node.js & Express:** A lightweight backend server (`server.js`) that safely proxies requests to the TMDB API.
- **Firebase:** 
  - *Firestore:* Real-time database for user comments, ratings, and watchlists.
  - *Auth:* Secure user login and registration.
- **Sentiment (npm package):** NLP processing to calculate the emotional delta of user comments.
<<<<<<< HEAD

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adi03-rgb/movie_review_website.git
   cd movie_review_website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   TMDB_API_KEY=your_tmdb_api_key
   ```
   *(Note: The `.env` file is excluded from version control via `.gitignore` for security).*

4. **Start the Backend Server:**
   Open a terminal and start the Express server:
   ```bash
   node src/components/server.js
   ```

5. **Start the Frontend Development Server:**
   Open a second terminal and start Vite:
   ```bash
   npm run dev
   ```

6. **Open the App:**
   Visit `http://localhost:5173` in your browser!

---

## 💡 How Sentiment Analysis Works

POPTALE doesn't just average out 5-star ratings. It actively reads the text of user reviews:
1. It splits reviews into individual sentences.
2. It assigns a mathematical sentiment score (positive/negative magnitude) to the sentence.
3. It cross-references the sentence for aspect keywords (e.g., if a sentence mentions "CGI" or "Effects", it maps it to the VFX category).
4. Finally, it extracts the most emotionally charged sentence as a quote and displays it directly on the movie's detail page!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
=======
>>>>>>> 93f23562c754c9a68813d82bdaa4806f6ee38f10
