// frontend/src/lib/api.js

// BASE per le API: prende prima l'env, se non c'è usa localhost:4000
const BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function getToken()        { return localStorage.getItem('token'); }
function getRefreshToken() { return localStorage.getItem('refresh_token'); }

function saveTokens({ token, refreshToken }) {
  if (token)        localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth-changed'));
}

let _refreshing = null;
async function tryRefresh() {
  const rt = getRefreshToken();
  if (!rt) return false;
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const res  = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { clearTokens(); return false; }
      const data = await res.json();
      saveTokens({ token: data.token, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers, Authorization: `Bearer ${token}` };
  const res = await fetch(url, { ...options, headers });
  if (res.status !== 401) return res;
  const refreshed = await tryRefresh();
  if (!refreshed) return res;
  const newToken  = getToken();
  return fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${newToken}` } });
}

// helper per querystring
function qs(obj) {
  const u = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.append(k, String(v));
  });
  return u.toString();
}

// helper date: inizio/fine giornata in UTC
export const toUtcStart = d => (d ? `${d}T00:00:00Z` : undefined);
export const toUtcEnd   = d => (d ? `${d}T23:59:59Z` : undefined);

// ---- TICKETMASTER: ricerca eventi ----
export async function searchEvents({ city, keyword, size = 12, page = 0, start, end, genre }) {
  const url = `${BASE}/api/ticketmaster/events?${qs({
    city,
    keyword,
    size,
    page,
    start,
    end,
    genre,
  })}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---- TICKETMASTER: suggerimenti artisti ----
export async function searchAttractions(keyword) {
  const url = `${BASE}/api/ticketmaster/attractions?${qs({ keyword })}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.attractions || [];
}

// ---- TICKETMASTER: dettaglio singolo evento ----
export async function getEvent(id) {
  const res = await fetch(
    `${BASE}/api/ticketmaster/events/${encodeURIComponent(id)}`
  );

  if (res.status === 404) {
    // Distingue il vero "evento inesistente" (JSON dal nostro backend)
    // da un 404 di rotta assente (backend non aggiornato / URL errato).
    const body = await res.json().catch(() => null);
    if (body && body.error === "Evento non trovato") {
      throw new Error("NOT_FOUND");
    }
    throw new Error("ENDPOINT_MISSING");
  }

  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---- SPOTIFY: artista per nome ----
export async function getSpotifyArtist(name, signal) {
  const res = await fetch(
    `${BASE}/api/spotify/artist?name=${encodeURIComponent(name)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  return res.json();
}

// ---- YOUTUBE: ultimi video del canale artista ----
export async function getYoutubeVideos(name, signal) {
  const res = await fetch(
    `${BASE}/api/youtube/channel-videos?name=${encodeURIComponent(name)}`,
    { signal }
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---- TICKETMASTER: prossime date di un artista ----
export async function getArtistEvents(id, signal) {
  const res = await fetch(
    `${BASE}/api/ticketmaster/artists/${encodeURIComponent(id)}/events`,
    { signal }
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ---- AUTH: login / registrazione ----

// POST /api/auth/login
export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Errore login');
  }

  saveTokens({ token: data.token, refreshToken: data.refreshToken });
  window.dispatchEvent(new Event('auth-changed'));
  return data;
}

// POST /api/auth/register
export async function registerUser(email, password) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Errore registrazione');
  }

  saveTokens({ token: data.token, refreshToken: data.refreshToken });
  window.dispatchEvent(new Event('auth-changed'));
  return data;
}

// ---- PREFERITI: richiedono token nell'header ----

// GET /api/favorites
export async function getFavorites() {
  const res = await authFetch(`${BASE}/api/favorites`);
  if (!res.ok) throw new Error('Errore caricamento preferiti');
  return res.json();
}

// POST /api/favorites
export async function addFavorite(event) {
  const res = await authFetch(`${BASE}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Errore salvataggio preferito');
  return res.json();
}

// ---- PROFILO UTENTE ----
export async function getProfile() {
  const res = await authFetch(`${BASE}/api/auth/profile`);
  if (!res.ok) throw new Error('Errore caricamento profilo');
  return res.json();
}

export async function updateProfile(data) {
  const res = await authFetch(`${BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Errore aggiornamento profilo');
  return res.json();
}

export async function updatePassword(currentPassword, newPassword) {
  const res = await authFetch(`${BASE}/api/auth/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Errore aggiornamento password');
  return data;
}

// ---- WEATHER: previsione per la data del concerto ----
export async function getWeather({ lat, lon, date }, signal) {
  const res = await fetch(`${BASE}/api/weather?${qs({ lat, lon, date })}`, { signal });
  if (!res.ok) throw new Error(`Weather ${res.status}`);
  return res.json();
}

// ---- SETLIST: ultima scaletta dell'artista ----
export async function getSetlist(artist, signal) {
  const res = await fetch(`${BASE}/api/setlist?artist=${encodeURIComponent(artist)}`, { signal });
  if (!res.ok) throw new Error(`Setlist ${res.status}`);
  return res.json();
}

// DELETE /api/favorites/:id
export async function removeFavorite(id) {
  const res = await authFetch(`${BASE}/api/favorites/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Errore eliminazione preferito');
  return res.json();
}
