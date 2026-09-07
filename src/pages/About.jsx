import { useEffect, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import "./About.css";

const About = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/movies/trending`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(Array.isArray(data) ? data.slice(0, 10) : []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [movies]);

  const currentMovie = movies.length > 0 ? movies[currentIndex] : null;
  const bgImage = currentMovie
    ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://image.tmdb.org/t/p/original${currentMovie.backdrop_path})`
    : "var(--hero-gradient)";

  return (
    <div>
        <section className="hero">
          <AnimatePresence mode="wait">
            <Motion.div 
              key={currentIndex}
              className="bg left"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 1 }}
              style={{
                backgroundImage: bgImage,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
          </AnimatePresence>
          <Motion.div className="content"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6}}
            viewport={{ once: true, amount: 0.2 }}>
            <div className="con2">
              <h1 className="hp">POPTALE</h1>
              <p className='pe'>Entertainment isn’t just content. It’s a tale worth popping into.</p>
            </div>
          </Motion.div>  
        </section>

      <Motion.section className="cont"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6}}
          viewport={{ once: true, amount: 0.2 }}>
        
        <h2 className='ab2'>About Poptale</h2>
        <p className='ab'>
          Poptale is where you go to figure out what to watch next — and everything that happens after you watch it. We pull together detailed movie and series information, ratings, reviews, and real-time trending data into one place, so deciding what's worth your time takes minutes, not scrolling sessions. Whether you're a casual viewer looking for tonight's pick or a cinephile chasing hidden gems, Poptale turns browsing into something closer to discovery.
        </p>
        <p className='ab'>
          But we don't stop at "what to watch." Poptale is built around the idea that entertainment doesn't end when the credits roll — it's meant to be discussed, debated, and remembered. That's why we've built watchlists, community-driven reviews, and direct links into the conversations already happening around every title, all wrapped into one seamless experience.
        </p>

        <h2 className='ab2' style={{ marginTop: '40px' }}>How Poptale works</h2>
        <p className='ab'>Getting started is simple:</p>
        
        <Motion.div 
          className="featuresGrid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>🏠 Home</h3>
            <p>Gives you a personalized front page — new releases, trending titles, and picks tailored to what you've already watched and liked.</p>
          </Motion.div>
          
          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>🧭 Discover</h3>
            <p>Your browsing hub. Filter by genre, mood, or format to explore movies and series, or jump straight into what's trending right now.</p>
          </Motion.div>
          
          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>📌 Watchlist</h3>
            <p>Where you save what you plan to watch. Add a title in one tap, organize it your way, and never lose track of recommendations.</p>
          </Motion.div>
          
          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>📺 Series</h3>
            <p>A dedicated space for tracking TV — episodes, seasons, and what's airing next — separate from the noise of movie listings.</p>
          </Motion.div>
        </Motion.div>

        <p className='ab' style={{ marginTop: '30px' }}>
          Every tab is designed to answer one question at a different stage: what's out there, what do I want to watch, and what am I already watching.
        </p>

        <h2 className='ab2' style={{ marginTop: '60px' }}>What makes Poptale different</h2>
        
        <Motion.div 
          className="featuresGrid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>💬 Real conversations</h3>
            <p>Not just star ratings. Every title links directly to Reddit discussion threads, so you get the actual debate: fan theories, hot takes, and real reviews in real time.</p>
          </Motion.div>

          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>📂 Built around you</h3>
            <p>Create and organize personalized watchlists that adapt as your taste does — save now, sort later, and always know exactly what's queued up next.</p>
          </Motion.div>

          <Motion.div className="featureCard" variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <h3>🧠 Actually learns</h3>
            <p>Our recommendation engine looks at what you've watched, rated, and saved to surface titles you're genuinely likely to love — including hidden gems.</p>
          </Motion.div>
        </Motion.div>

        <p className='ab' style={{ marginTop: '30px' }}>
          Together, these turn Poptale from a listings site into something closer to a home base for how you experience entertainment — find it, track it, talk about it, remember it.
        </p>

      </Motion.section>
    </div>
  )
}

export default About;
