import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Apply initial theme before React renders to avoid a visible flash.
const storedTheme = window.localStorage.getItem("theme");
const prefersDark =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialTheme = storedTheme ?? (prefersDark ? "dark" : "light");
document.documentElement.dataset.theme = initialTheme;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App/>
  </StrictMode>
);
