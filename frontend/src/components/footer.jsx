// frontend/src/components/footer.jsx

import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__about">
            <Link to="/home" className="brand">
              <svg width="110" height="26" viewBox="0 0 200 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Setlist">
                <rect x="0" y="4"  width="36" height="5" rx="2.5" fill="#00D48A"/>
                <rect x="0" y="15" width="24" height="5" rx="2.5" fill="#00D48A"/>
                <rect x="0" y="26" width="31" height="5" rx="2.5" fill="#00D48A"/>
                <rect x="0" y="37" width="19" height="5" rx="2.5" fill="#00D48A"/>
                <text x="52" y="38" fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif" fontSize="30" fontWeight="700" fill="#EEF1FF" letterSpacing="-0.8">Setlist</text>
              </svg>
            </Link>
            <p>
              Concerti, festival, esperienze live — tutto nella tua setlist.
              Cerca per città e artista, ascolta su Spotify e pianifica la serata.
            </p>
          </div>

          <div className="footer__col">
            <h4>Prodotto</h4>
            <Link to="/home">Esplora eventi</Link>
            <Link to="/favorites">I miei preferiti</Link>
            <Link to="/login">Accedi</Link>
          </div>

          <div className="footer__col">
            <h4>Risorse</h4>
            <a href="#how">Come funziona</a>
            <a href="#why">Perché Setlist</a>
            <a
              href="https://www.ticketmaster.com"
              target="_blank"
              rel="noreferrer"
            >
              Dati eventi
            </a>
          </div>

          <div className="footer__col">
            <h4>Legale</h4>
            <Link to="/privacy">Privacy</Link>
            <Link to="/termini">Termini</Link>
            <Link to="/cookie">Cookie</Link>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="footer__bar">
          <span>© {year} Setlist · Tutti i diritti riservati</span>
          <span>
            Designed &amp; developed by <span className="hl">Fabio Annoni</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
