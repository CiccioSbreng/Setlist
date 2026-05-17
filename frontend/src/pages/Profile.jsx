// frontend/src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFavorites } from "../lib/api";
import { UserIcon, HeartIcon, MusicIcon } from "../components/Icons";

function decodeToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favCount, setFavCount] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    setUser(decodeToken(token));
    getFavorites().then((list) => setFavCount(list.length)).catch(() => {});
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/home");
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="profile-page">
          <div className="profile-page__avatar">
            <UserIcon size={36} />
          </div>
          <h1 className="profile-page__email">{user?.email || "Utente"}</h1>
          {favCount !== null && (
            <p className="profile-page__stat">
              <HeartIcon size={16} filled />
              {favCount} {favCount === 1 ? "evento salvato" : "eventi salvati"}
            </p>
          )}
          <div className="profile-page__actions">
            <Link to="/favorites" className="btn btn--primary">
              <HeartIcon size={18} />
              I miei preferiti
            </Link>
            <Link to="/home" className="btn btn--ghost">
              <MusicIcon size={18} />
              Esplora concerti
            </Link>
            <button type="button" className="btn btn--ghost profile-page__logout" onClick={handleLogout}>
              Esci dall'account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
