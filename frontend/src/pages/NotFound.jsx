// frontend/src/pages/NotFound.jsx

import { Link } from "react-router-dom";
import { MusicIcon, SearchIcon } from "../components/Icons";

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="not-found">
          <div className="not-found__icon">
            <MusicIcon size={36} />
          </div>
          <h1 className="not-found__code">404</h1>
          <h2 className="not-found__title">Pagina non trovata</h2>
          <p className="not-found__sub">
            La pagina che cerchi non esiste o è stata spostata.
          </p>
          <div className="not-found__actions">
            <Link to="/home" className="btn btn--primary">
              <SearchIcon size={18} />
              Esplora concerti
            </Link>
            <Link to="/favorites" className="btn btn--ghost">
              Torna ai preferiti
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
