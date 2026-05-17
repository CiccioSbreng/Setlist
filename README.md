# ConcertHub

Piattaforma per scoprire concerti ed eventi live. Cerca per città o artista, guarda bio, video e musica dell'artista, salva i tuoi preferiti e pianifica la serata con mappa e hotel.

**Progetto portfolio** — dati da Ticketmaster, Spotify, YouTube, Wikipedia, OpenStreetMap.

---

## Stack

| Layer | Tecnologie |
|---|---|
| Frontend | React 18, Vite, React Router, CSS custom |
| Backend | Node.js, Express, MongoDB Atlas, Mongoose |
| Auth | JWT + bcrypt |
| API esterne | Ticketmaster Discovery v2, Spotify Web API, YouTube Data v3, Wikipedia REST, OpenStreetMap/Overpass |

---

## Funzionalità

- Ricerca eventi per città, keyword, range di date
- Dettaglio evento: venue, prezzi, lineup, note
- Profilo artista: bio Wikipedia, embed Spotify, ultimo video YouTube
- Mappa interattiva OpenStreetMap + link Google Maps
- Parchi/aree verdi nei dintorni (Overpass API)
- Link hotel Booking.com e Airbnb
- Autenticazione (registrazione / login)
- Lista preferiti persistita su MongoDB
- Sfondo gradient mesh animato
- Pagine legali (Privacy, Termini, Cookie)
- Responsive desktop + mobile

---

## Avvio locale

```bash
# Backend
cd backend
cp .env.example .env   # compila le chiavi API
npm install
npm run dev            # porta 4000

# Frontend
cd frontend
npm install
npm run dev            # porta 5173
```

### Variabili d'ambiente (backend/.env)

```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
TICKETMASTER_API_KEY=...
MONGO_URI=...
JWT_SECRET=...
YOUTUBE_API_KEY=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

---

## Struttura

```
concertHub/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/          # ticketmaster, auth, favorites, youtube, spotify
│   │   └── models/          # User, Favorite
│   └── .env                 # non in repo
└── frontend/
    ├── src/
    │   ├── pages/           # Home, EventDetail, Favorites, Login, Legal, NotFound
    │   ├── components/      # Navbar, Footer, EventCard, GradientBackground, …
    │   ├── lib/api.js
    │   └── styles.css
    └── index.html
```

---

Designed & developed by **Fabio Annoni**
