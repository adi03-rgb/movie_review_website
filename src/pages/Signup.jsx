import { useEffect, useState } from "react";
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import "./Login.css";

function Signup() {
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND}/api/movies/genres`)
      .then((res) => res.json())
      .then((data) => setGenres(data.genres || []))
      .catch((e) => console.error("Failed to load genres:", e));
  }, []);

  const toggleGenre = (id) => {
    setSelectedGenreIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return Array.from(s);
    });
  };

  const signup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        const selectedObjects = genres.filter((g) =>
          selectedGenreIds.includes(g.id),
        );

        // Save interested genres immediately after account creation.
        setDoc(
          doc(db, "users", user.uid),
          {
            interestedGenres: selectedObjects.map((g) => ({
              id: g.id,
              name: g.name,
            })),
          },
          { merge: true },
        )
          .catch((error) => console.error("Failed to save genres:", error))
          .finally(() => {
            console.log("User created:", user);
            navigate("/profile");
          });
      })
      .catch((error) => {
        alert(error.message); 
        console.log("Error Message:", error.message);
      });
  };

  return (
    <div className="whole1">
      <div className="ex">
        <img src="/pp.gif" alt="pp" id='im1'/>
        <h1>Join Us</h1>
      </div>

      <div className="log">
        <h2 className="h">Signup</h2>

        <input
      className="input"
       placeholder="Username"
     />

        <input
          className="input"
          type="email"
          placeholder="Enter Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Create Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="genrePicker">
          <h3 className="genreTitle">Interested genres</h3>
          <div className="genreChips" role="group" aria-label="Pick genres">
            {genres.map((g) => {
              const active = selectedGenreIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`genreChip ${active ? "active" : ""}`}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>

        <button className="but" onClick={signup}>
          Create Account
        </button>
        
        <p style={{fontFamily: 'Inter', cursor: 'pointer'}} onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}

export default Signup;