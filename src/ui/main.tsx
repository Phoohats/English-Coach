import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { ConceptLab } from "./concepts/ConceptLab.js";
import "./styles.css";
import "./concepts/concepts.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found");
}

createRoot(root).render(
  <StrictMode>
    {new URLSearchParams(window.location.search).get("mockups") === "1" ? <ConceptLab /> : <App />}
  </StrictMode>,
);
