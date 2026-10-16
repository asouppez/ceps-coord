import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { configError, storage } from "./lib/storage.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

if (configError) {
  // Écran explicatif plutôt qu'une page blanche
  root.render(
    <div style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "Poppins, sans-serif", color: "#18191A", background: "#EAF4F4", borderRadius: 12 }}>
      <h2 style={{ fontFamily: "Livvic, sans-serif", color: "#035D72" }}>Configuration manquante</h2>
      <p>{configError}</p>
      <p>Dans Netlify : <b>Site configuration → Environment variables</b>, ajoutez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>, puis relancez un déploiement (<b>Deploys → Trigger deploy → Clear cache and deploy site</b>).</p>
    </div>
  );
} else {
  // L'application utilise window.storage : on le branche sur Supabase.
  window.storage = storage;
  root.render(<App />);
}
