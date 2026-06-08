import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MusicIcon, HeartIcon, UserIcon } from "./Icons";
import { getFavorites } from "../lib/api";

export default function BottomNav() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    function sync() {
      const t = localStorage.getItem("token");
      setToken(t);
      if (!t) setFavCount(0);
    }
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);

  useEffect(() => {
    if (!token) { setFavCount(0); return; }
    getFavorites().then((list) => setFavCount(list.length)).catch(() => {});
  }, [token]);

  useEffect(() => {
    function onFavChanged(e) {
      const { type } = e.detail || {};
      if (type === "add")    setFavCount((c) => c + 1);
      else if (type === "remove") setFavCount((c) => Math.max(0, c - 1));
      else {
        const t = localStorage.getItem("token");
        if (t) getFavorites().then((list) => setFavCount(list.length)).catch(() => {});
      }
    }
    window.addEventListener("favorites-changed", onFavChanged);
    return () => window.removeEventListener("favorites-changed", onFavChanged);
  }, []);

  const cls = ({ isActive }) => "bottom-nav__item" + (isActive ? " is-active" : "");

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      <NavLink to="/home" className={cls}>
        <MusicIcon size={26} />
        <span>Esplora</span>
      </NavLink>
      <NavLink to="/favorites" className={cls}>
        <div className="bottom-nav__icon-wrap">
          <HeartIcon size={26} />
          {favCount > 0 && (
            <span className="bottom-nav__badge">{favCount > 99 ? "99+" : favCount}</span>
          )}
        </div>
        <span>Preferiti</span>
      </NavLink>
      {token ? (
        <NavLink to="/profile" className={cls}>
          <UserIcon size={26} />
          <span>Profilo</span>
        </NavLink>
      ) : (
        <NavLink to="/login" className={cls}>
          <UserIcon size={26} />
          <span>Accedi</span>
        </NavLink>
      )}
    </nav>
  );
}
