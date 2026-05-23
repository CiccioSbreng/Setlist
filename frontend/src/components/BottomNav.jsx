import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MusicIcon, HeartIcon, UserIcon } from "./Icons";

export default function BottomNav() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    function sync() { setToken(localStorage.getItem("token")); }
    window.addEventListener("auth-changed", sync);
    return () => window.removeEventListener("auth-changed", sync);
  }, []);

  const cls = ({ isActive }) => "bottom-nav__item" + (isActive ? " is-active" : "");

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      <NavLink to="/home" className={cls}>
        <MusicIcon size={22} />
        <span>Esplora</span>
      </NavLink>
      <NavLink to="/favorites" className={cls}>
        <HeartIcon size={22} />
        <span>Preferiti</span>
      </NavLink>
      {token ? (
        <NavLink to="/profile" className={cls}>
          <UserIcon size={22} />
          <span>Profilo</span>
        </NavLink>
      ) : (
        <NavLink to="/login" className={cls}>
          <UserIcon size={22} />
          <span>Accedi</span>
        </NavLink>
      )}
    </nav>
  );
}
