// frontend/src/components/footer.jsx

import { Link } from "react-router-dom";
import { MusicIcon } from "./Icons";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__about">
            <Link to="/home" className="brand">
              <span className="brand__mark">
                <MusicIcon size={20} />
              </span>
              Concert<span className="brand__accent">Hub</span>
            </Link>
            <p>
              La piattaforma per scoprire concerti ed eventi live nella tua
              città. Cerca artisti, salva i tuoi preferiti e non perderti più
              uno show.
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
            <a href="#why">Perché ConcertHub</a>
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
          <span>© {year} ConcertHub · Tutti i diritti riservati</span>
          <span>
            Creato da <span className="hl">Ciccio Sbreng</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
