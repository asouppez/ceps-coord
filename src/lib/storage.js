/* Sauvegarde : reproduit window.storage de Claude, mais dans Supabase (table app_storage).
   Variables Netlify : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
   La session (qui est connecté) reste dans le navigateur de chaque personne :
   elle ne doit PAS être partagée entre les utilisateurs. */

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const configError =
  !URL_BASE || !KEY
    ? "Les variables VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont absentes de Netlify."
    : null;

const LOCAL_KEYS = new Set(["coord-session"]);

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};
const TABLE = `${URL_BASE}/rest/v1/app_storage`;

/* Bandeau visible : vert = enregistré, rouge = problème (avec la cause) */
function banner(message, ok) {
  try {
    let el = document.getElementById("save-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "save-banner";
      el.style.cssText =
        "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:10px;font:600 14px Poppins,sans-serif;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:92vw;text-align:center";
      document.body.appendChild(el);
    }
    el.style.background = ok ? "#1f8a4c" : "#b3261e";
    el.textContent = message;
    el.style.display = "block";
    clearTimeout(el._t);
    if (ok) el._t = setTimeout(() => { el.style.display = "none"; }, 2000);
  } catch (e) { /* rien */ }
}

function fail(action, key, res) {
  let detail = "pas de connexion à Supabase";
  if (res) {
    detail = `code ${res.status}`;
    if (res.status === 404) detail += " : table app_storage introuvable";
    if (res.status === 401 || res.status === 403) detail += " : clé ou droits refusés";
  }
  const message = `Sauvegarde ÉCHOUÉE (${action} ${key}) — ${detail}`;
  console.error("[sauvegarde]", message);
  banner(message, false);
  throw new Error(message);
}

export const storage = {
  async get(key) {
    if (LOCAL_KEYS.has(key)) {
      const v = window.localStorage.getItem("ipl-" + key);
      return v == null ? null : { key, value: v };
    }
    let res;
    try {
      res = await fetch(`${TABLE}?key=eq.${encodeURIComponent(key)}&select=value`, { headers });
    } catch (e) { fail("lecture", key, null); }
    if (!res.ok) fail("lecture", key, res);
    const rows = await res.json();
    return rows.length ? { key, value: rows[0].value } : null;
  },

  async set(key, value) {
    if (LOCAL_KEYS.has(key)) {
      window.localStorage.setItem("ipl-" + key, value);
      return { key, value };
    }
    let res;
    try {
      res = await fetch(`${TABLE}?on_conflict=key`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
      });
    } catch (e) { fail("écriture", key, null); }
    if (!res.ok) fail("écriture", key, res);
    banner("Sauvegardé ✓", true);
    return { key, value };
  },

  async delete(key) {
    if (LOCAL_KEYS.has(key)) {
      window.localStorage.removeItem("ipl-" + key);
      return { key, deleted: true };
    }
    let res;
    try {
      res = await fetch(`${TABLE}?key=eq.${encodeURIComponent(key)}`, { method: "DELETE", headers });
    } catch (e) { fail("suppression", key, null); }
    if (!res.ok) fail("suppression", key, res);
    return { key, deleted: true };
  },
};
