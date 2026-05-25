// frontend/src/components/navbar.jsx

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function handleAuthChange() {
      setToken(localStorage.getItem("token"));
    }
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y > lastY.current && y > 80) setHidden(true);
      else setHidden(false);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <nav className={"nav" + (hidden ? " nav--hidden" : "")}>
      <div className="wrap nav__inner">
        <Link to="/home" className="brand" onClick={() => setOpen(false)}>
          <svg width="120" height="29" viewBox="0 0 200 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Setlist">
            <rect x="0" y="4"  width="36" height="5" rx="2.5" fill="#00D48A"/>
            <rect x="0" y="15" width="24" height="5" rx="2.5" fill="#00D48A"/>
            <rect x="0" y="26" width="31" height="5" rx="2.5" fill="#00D48A"/>
            <rect x="0" y="37" width="19" height="5" rx="2.5" fill="#00D48A"/>
            <text x="52" y="38" fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif" fontSize="30" fontWeight="700" fill="#EEF1FF" letterSpacing="-0.8">Setlist</text>
          </svg>
        </Link>

        <div className="nav__links">
          <NavLink to="/home" className={linkClass}>
            <MusicIcon size={18} />
            Esplora
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            <HeartIcon size={18} />
            My List
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
            My List
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
