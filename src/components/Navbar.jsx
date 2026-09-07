import React from 'react'
import "./Navbar.css"
import { Link, NavLink } from "react-router-dom"
import { useState } from "react"

const Navbar = () => {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || "light",
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <div className='nav'>
      <Link to="/" className='n1' id='n'> 
        <img src="pp.gif" alt="" id='nim' />
        POPTALE
      </Link>
      <ul>
        <li id='li'><NavLink to="/" id='n' end>Home</NavLink></li>
        <li id='li'><NavLink to="/profile" id='n'>Profile</NavLink></li>
        <li id='li'><NavLink to="/about" id='n'>Discover</NavLink></li>
        <li id='li'><NavLink to="/dashboard" id='n'>Search</NavLink></li>
        <li id='li'><NavLink to="/login" id='n'>Login</NavLink></li>
        <li id='li'><NavLink to="/signup" id='n'>Signup</NavLink></li>
        <li id='li'>
          <button
            type="button"
            className="themeToggle"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </li>
      </ul>
    </div>
  )
}

export default Navbar
