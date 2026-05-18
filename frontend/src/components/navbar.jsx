// frontend/src/components/navbar.jsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MusicIcon,
  HeartIcon,
  UserIcon,
  MenuIcon,
  CloseIcon,
} from "./Icons";

export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleAuthChange() {
      setToken(localStorage.getItem("token"));
    }
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    setOpen(false);
    navigate("/home");
  }

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " is-active" : "");

  return (
    <nav className="nav">
      <div className="wrap nav__inner">
        <Link to="/home" className="brand" onClick={() => setOpen(false)}>
          <span className="brand__mark">
            <MusicIcon size={20} />
          </span>
          Concert<span className="brand__accent">Hub</span>
        </Link>

        <div className="nav__links">
          <NavLink to="/home" className={linkClass}>
            <MusicIcon size={18} />
            Esplora
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            <HeartIcon size={18} />
            Preferiti
          </NavLink>

          {!token ? (
            <NavLink to="/login" className="btn btn--primary btn--sm nav__cta">
              <UserIcon size={18} />
              Accedi
            </NavLink>
          ) : (
            <>
              <NavLink to="/profile" className={linkClass}>
                <UserIcon size={18} />
                Profilo
              </NavLink>
              <button
                type="button"
                className="btn btn--ghost btn--sm nav__cta"
                onClick={handleLogout}
              >
                Esci
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav__burger"
          aria-label="Apri menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>

      <div className="wrap">
        <div className={"nav__mobile" + (open ? " open" : "")}>
          <NavLink
            to="/home"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <MusicIcon size={18} />
            Esplora
          </NavLink>
          <NavLink
            to="/favorites"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <HeartIcon size={18} />
            Preferiti
          </NavLink>

          {!token ? (
            <NavLink
              to="/login"
              className="btn btn--primary btn--block"
              onClick={() => setOpen(false)}
            >
              <UserIcon size={18} />
              Accedi
            </NavLink>
          ) : (
            <>
              <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                <UserIcon size={18} />
                Il mio profilo
              </NavLink>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={handleLogout}
              >
                Esci
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
