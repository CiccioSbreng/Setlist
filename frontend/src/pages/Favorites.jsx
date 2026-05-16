// frontend/src/pages/Favorites.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites, removeFavorite } from "../lib/api";
import EventCard from "../components/EventCard";
import {
  HeartIcon,
  LockIcon,
  SearchIcon,
  ArrowRightIcon,
} from "../components/Icons";

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await getFavorites();
        setItems(res);
      } catch (e) {
        setError(
          e.message || "Non è stato possibile caricare i tuoi preferiti."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  async function handleDelete(id) {
    try {
      await removeFavorite(id);
      setItems((prev) => prev.filter((f) => f._id !== id));
    } catch (e) {
      setError(e.message || "Non è stato possibile rimuovere il preferito.");
    }
  }

  // Non autenticato
  if (!token) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="state" style={{ maxWidth: 560, margin: "0 auto" }}>
            <div className="state__icon">
              <LockIcon size={30} />
            </div>
            <h3>Accedi per vedere i tuoi preferiti</h3>
            <p>
              Crea un account o effettua il login per salvare i concerti che ami
              e ritrovarli quando vuoi.
            </p>
            <Link to="/login" className="btn btn--primary">
              Vai al login
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head" style={{ textAlign: "left", margin: 0 }}>
          <span className="eyebrow">
            <HeartIcon size={14} /> La tua collezione
          </span>
          <h2 style={{ marginTop: 16 }}>I tuoi eventi preferiti</h2>
          <p style={{ marginTop: 10 }}>
            {loading
              ? "Caricamento della tua lista…"
              : items.length > 0
              ? `Hai ${items.length} ${
                  items.length === 1 ? "evento salvato" : "eventi salvati"
                }.`
              : "Qui troverai tutti i concerti che salvi."}
          </p>
        </div>

        {error && (
          <div className="banner banner--error" style={{ marginTop: 28 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          {loading && (
            <div className="events-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div className="sk-card" key={i}>
                  <div className="sk sk--media" />
                  <div className="sk sk--line w70" />
                  <div className="sk sk--line w45" />
                  <div className="sk sk--line" style={{ marginBottom: 18 }} />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="state">
              <div className="state__icon">
                <HeartIcon size={30} />
              </div>
              <h3>Nessun preferito… per ora</h3>
              <p>
                Esplora gli eventi e tocca il cuore sulle card per salvarli
                qui. La tua collezione personale ti aspetta.
              </p>
              <Link to="/home" className="btn btn--primary">
                <SearchIcon size={18} />
                Esplora eventi
              </Link>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="events-grid">
              {items.map((fav) => (
                <EventCard
                  key={fav._id}
                  ev={{
                    id: fav._id,
                    eventId: fav.eventId,
                    name: fav.name,
                    image: fav.image,
                    date: fav.date,
                    venue: fav.venue,
                    city: fav.city,
                    url: fav.url,
                  }}
                  onRemove={() => handleDelete(fav._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
