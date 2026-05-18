# ConcertHub — Trova i concerti nella tua città

ConcertHub è un’applicazione web che permette agli utenti di cercare e visualizzare concerti ed eventi musicali nella propria città, con un focus particolare sul mercato italiano.  
L’app integra API esterne per ottenere eventi aggiornati e offre funzionalità personalizzate tramite autenticazione e gestione dei preferiti.

---

## Caratteristiche principali

- Ricerca dei concerti per città, parola chiave e intervallo di date
- Visualizzazione degli eventi con immagini, venue, data e link esterno
- Registrazione e autenticazione tramite JWT
- Possibilità per l’utente registrato di salvare concerti tra i preferiti
- Interfaccia responsive basata su React + Bootstrap
- Backend Node.js con Express e MongoDB Atlas

---

## Tecnologie utilizzate

### Frontend
- React (con Vite)
- Bootstrap
- Fetch API per chiamate al backend

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT per autenticazione
- BcryptJS per hashing password
- Axios per chiamate alle API esterne
- Helmet, CORS, Express-rate-limit, Morgan

### API esterne
- Ticketmaster API (eventi musicali)

---

## Struttura del progetto

# ConcertHub — Trova i concerti nella tua città

ConcertHub è un’applicazione web che permette agli utenti di cercare e visualizzare concerti ed eventi musicali nella propria città, con un focus particolare sul mercato italiano.  
L’app integra API esterne per ottenere eventi aggiornati e offre funzionalità personalizzate tramite autenticazione e gestione dei preferiti.

---

## Caratteristiche principali

- Ricerca dei concerti per città, parola chiave e intervallo di date
- Visualizzazione degli eventi con immagini, venue, data e link esterno
- Registrazione e autenticazione tramite JWT
- Possibilità per l’utente registrato di salvare concerti tra i preferiti
- Interfaccia responsive basata su React + Bootstrap
- Backend Node.js con Express e MongoDB Atlas

---

## Tecnologie utilizzate

### Frontend
- React (con Vite)
- Bootstrap
- Fetch API per chiamate al backend

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT per autenticazione
- BcryptJS per hashing password
- Axios per chiamate alle API esterne
- Helmet, CORS, Express-rate-limit, Morgan

### API esterne
- Ticketmaster API (eventi musicali)

---

## Struttura del progetto

project/
├── backend/
│ ├── src/
│ │ ├── server.js
│ │ ├── routes/
│ │ ├── controllers/
│ │ └── models/
│ ├── package.json
│ └── .env (non incluso nel repository)
└── frontend/
├── src/
│ ├── pages/
│ ├── components/
│ ├── lib/api.js
│ └── App.jsx
├── package.json
