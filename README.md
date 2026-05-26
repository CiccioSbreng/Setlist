# Setlist

> Scopri concerti ed eventi live: cerca per città o artista, esplora bio,
> video, scaletta probabile e top tracks, salva i tuoi preferiti e pianifica
> la serata con meteo, mappa, hotel e dintorni del venue.

**Progetto portfolio** — dati live aggregati da Ticketmaster, Spotify,
YouTube, Setlist.fm, Open-Meteo, Wikipedia, OpenStreetMap. Nessun servizio
a pagamento, nessuna vendita di biglietti.

---

## Stack

| Layer        | Tecnologie                                                                                          |
|--------------|-----------------------------------------------------------------------------------------------------|
| Frontend     | React 18, Vite, React Router 6, Sonner (toast), CSS custom (no Tailwind)                            |
| Backend      | Node.js, Express 4, Mongoose 8, Helmet, express-rate-limit, Winston, node-cache, axios              |
| Database     | MongoDB Atlas                                                                                       |
| Auth         | JWT (access + refresh) + bcryptjs                                                                   |
| API esterne  | Ticketmaster Discovery v2, Spotify Web API, YouTube Data v3, Setlist.fm, Open-Meteo, Wikipedia, OpenStreetMap/Overpass |
| Hosting      | Render (web service + static site, definito in `render.yaml`)                                       |

---

## Funzionalità

### Esplora
- Ricerca eventi per **città**, **keyword artista**, **range di date** e **genere**
- Suggerimenti città italiane con coordinate pre-mappate
- Card evento con immagine, data/ora, prezzo, genere, badge stato (annullato / rinviato / riprogrammato)
- Cuore "salva" inline per aggiungere ai preferiti senza aprire il dettaglio

### Dettaglio evento
- Hero 3D con tilt al movimento del mouse (disattivo su touch e con `prefers-reduced-motion`)
- Countdown live verso la data del concerto
- Barra tab sticky con sezioni **Evento / Artista / Dove & Come**
- CTA biglietti, condividi, salva, esporta su Google Calendar

### Artista
- Bio sintetica da Wikipedia
- Embed Spotify ufficiale + **top tracks** con preview audio
- Ultimo video YouTube dal canale dell'artista (risolto da handle/channel/user)
- Scaletta probabile dall'ultimo concerto disponibile (Setlist.fm)
- Prossime date in tour dall'artista (Ticketmaster)

### Dove & Come (logistica)
- Meteo previsto per il giorno del concerto (Open-Meteo, niente API key)
- Mappa OpenStreetMap embed + indicazioni Google
- POI nei dintorni del venue: **ristoranti**, **parcheggi**, **parchi** (Overpass)
- Link diretti a Booking.com, Airbnb, Uber, FREE NOW, trasporto pubblico
- Scheda Wikipedia della città

### Account
- Registrazione e login con email + password
- Refresh token automatico (rotazione a 401)
- Profilo: avatar (compresso lato client), display name, bio
- Cambio password
- Preferiti salvati su MongoDB e sincronizzati tra dispositivi

### UX
- Layout responsive desktop + mobile, con **bottom nav** dedicata su mobile
- Sfondo video animato + gradient mesh in CSS puro
- Skeleton states, page transition, lista stagger (tutto CSS, niente framer-motion)
- Pagine legali (Privacy, Termini, Cookie) e 404 custom

---

## API backend

Tutte le route sono sotto `/api`. Quelle con 🔒 richiedono header
`Authorization: Bearer <token>`.

| Metodo | Endpoint                                | Descrizione                                            |
|--------|-----------------------------------------|--------------------------------------------------------|
| GET    | `/api/ticketmaster/events`              | Ricerca eventi: `city`, `keyword`, `start`, `end`, `genre`, `page`, `size` |
| GET    | `/api/ticketmaster/events/:id`          | Dettaglio singolo evento normalizzato                  |
| GET    | `/api/ticketmaster/artists/:id/events`  | Prossime date di un artista                            |
| GET    | `/api/spotify/artist?name=`             | Artista Spotify (immagine, generi, follower, top tracks, embed) |
| GET    | `/api/youtube/channel-videos?name=`     | Ultimi video del canale YouTube dell'artista           |
| GET    | `/api/setlist?artist=`                  | Scaletta dell'ultimo concerto disponibile (Setlist.fm) |
| GET    | `/api/weather?lat=&lon=&date=`          | Previsione Open-Meteo per la data del concerto         |
| POST   | `/api/auth/register`                    | Registrazione (email, password)                        |
| POST   | `/api/auth/login`                       | Login (email, password) → `{ token, refreshToken }`    |
| POST   | `/api/auth/refresh`                     | Rinnova l'access token dal refresh token               |
| GET    | `/api/auth/profile` 🔒                  | Profilo utente corrente                                |
| PUT    | `/api/auth/profile` 🔒                  | Aggiorna display name, bio, avatar                     |
| PUT    | `/api/auth/password` 🔒                 | Cambio password                                        |
| GET    | `/api/favorites` 🔒                     | Elenco preferiti dell'utente                           |
| POST   | `/api/favorites` 🔒                     | Aggiunge / aggiorna un preferito (upsert su `eventId`) |
| DELETE | `/api/favorites/:id` 🔒                 | Rimuove un preferito                                   |
| GET    | `/__ping`                               | Healthcheck minimale                                   |

**Caching** lato server con `node-cache`:
- Ticketmaster: 15 minuti
- Spotify (artisti): 1 ora
- Spotify (token): 58 minuti
- YouTube: 30 minuti (quota giornaliera limitata)

**Hardening**: `helmet`, CORS allowlist (`CLIENT_ORIGIN`), rate limit globale
60 req/min su `/api/*`, gestione errori centralizzata (`errorHandler.js`)
con messaggi differenziati per Mongoose / JWT / CORS.

**Diagnostica all'avvio**: il backend stampa un banner con stato MongoDB e
fa un probe asincrono delle API esterne configurate, mostrando per ognuna
se la chiave è valida, manca, è in rate limit o irraggiungibile (vedi
`backend/src/lib/health.js`).

---

## Avvio locale

```bash
# Backend
cd backend
cp .env.example .env      # poi compila le chiavi
npm install
npm run dev               # http://localhost:4000

# Frontend (in un'altra shell)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Variabili d'ambiente

**Backend** (`backend/.env`):

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/setlist
JWT_SECRET=<stringa lunga e casuale>

# Obbligatorie all'avvio: il server si rifiuta di partire se mancano
TICKETMASTER_API_KEY=...

# Opzionali: se mancano, la relativa funzione resta disabilitata
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
YOUTUBE_API_KEY=...
SETLIST_API_KEY=...
```

Sono **obbligatorie** solo `TICKETMASTER_API_KEY` e `JWT_SECRET` (il server
esce con errore se mancano). Le altre chiavi sono opzionali: se non sono
configurate, gli endpoint relativi rispondono `503 not_configured` e il
frontend nasconde la sezione corrispondente.

`MONGO_URI` è anch'essa opzionale: senza Mongo, autenticazione e preferiti
sono disabilitati (`503 Database non disponibile`), ma il resto del sito
funziona.

**Frontend** (`frontend/.env` o variabile Render):

```env
VITE_API_BASE_URL=http://localhost:4000
```

In produzione punta all'URL del backend Render.

---

## Deploy

Il file `render.yaml` definisce due servizi su [Render](https://render.com):

1. **`concerthub-backend`** — Node web service, root `backend/`, start `npm start`
2. **`concerthub-frontend`** — Static site, root `frontend/`, build `npm run build`, publish `dist/`, con rewrite `/* → /index.html` per il client routing

Le variabili d'ambiente sono dichiarate con `sync: false`: vanno impostate
dalla dashboard di Render (non vengono committate).

---

## Struttura

```
Setlist/
├── backend/
│   ├── src/
│   │   ├── server.js                # bootstrap, CORS, rate-limit, banner
│   │   ├── routes/
│   │   │   ├── ticketmaster.js      # ricerca + dettaglio eventi
│   │   │   ├── auth.js              # register, login, refresh, profile, password
│   │   │   ├── favorites.js         # CRUD preferiti (richiede JWT)
│   │   │   ├── spotify.js           # artista + top tracks (client credentials)
│   │   │   ├── youtube.js           # ultimi video canale
│   │   │   ├── setlist.js           # scaletta da setlist.fm
│   │   │   └── weather.js           # previsione Open-Meteo
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── favorites.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # verify JWT
│   │   │   └── errorHandler.js
│   │   └── lib/
│   │       ├── logger.js            # winston
│   │       └── health.js            # probe API esterne all'avvio
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # routing + layout
│   │   ├── main.jsx
│   │   ├── styles.css               # design system + componenti
│   │   ├── pages/
│   │   │   ├── Home.jsx             # ricerca + risultati
│   │   │   ├── EventDetail.jsx      # hero, tab, sticky CTA
│   │   │   ├── ArtistPage.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── login.jsx
│   │   │   ├── Legal.jsx            # privacy, termini, cookie
│   │   │   └── NotFound.jsx
│   │   ├── components/
│   │   │   ├── navbar.jsx, footer.jsx, BottomNav.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── ArtistSection.jsx, VenueSection.jsx
│   │   │   ├── Countdown.jsx, DateRangePopover.jsx
│   │   │   ├── GradientBackground.jsx, VideoBackground.jsx
│   │   │   ├── Icons.jsx            # set SVG inline
│   │   │   └── Motion.jsx           # page transition + stagger (CSS)
│   │   ├── hooks/
│   │   │   ├── useHomeSearch.js     # stato ricerca, debounce, paginazione
│   │   │   ├── useArtistMedia.js    # bio + spotify + youtube + setlist
│   │   │   ├── useVenueData.js      # meteo + Overpass POI
│   │   │   ├── useEventFavorite.js
│   │   │   ├── useCountdown.js
│   │   │   └── useTilt.js
│   │   └── lib/
│   │       ├── api.js               # fetch wrapper + refresh token
│   │       ├── calendar.js          # export Google Calendar
│   │       └── format.js
│   ├── index.html
│   └── package.json
│
└── render.yaml
```

---

## Note

- Il package backend si chiama internamente `concerthub-backend` e il
  frontend `concerthub-frontend` (nome legacy del progetto). Il brand
  utente è **Setlist** ed è quello mostrato in UI.
- Le API key non vengono mai esposte al client: ogni chiamata verso
  servizi esterni passa dal backend, che proxy-a la risposta normalizzata.
- I preferiti dell'utente sono indicizzati su `(user, eventId)` con
  vincolo `unique`, così l'inserimento di un duplicato fa upsert
  dell'evento.

---

Designed & developed by **Fabio Annoni**
