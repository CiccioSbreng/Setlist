import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getFavorites } from "../lib/api";
import {
  MusicIcon, HeartIcon, UserIcon, MenuIcon, CloseIcon, SearchIcon, PinIcon,
} from "./Icons";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  const diff = Math.ceil((d - Date.now()) / 86_400_000);
  return diff >= 0 ? diff : null;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [sidebarOut, setSidebarOut] = useState(false);
  const sidebarTimer = useRef(null);
  const lastY = useRef(0);

  const [searchQ, setSearchQ] = useState("");
  const [cityQ,   setCityQ]   = useState("");
  const [upcomingFavs, setUpcomingFavs] = useState([]);
  const tokenRef = useRef(token);

  useEffect(() => {
    function handleAuthChange() {
      const t = localStorage.getItem("token");
      tokenRef.current = t;
      setToken(t);
    }
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  const loadFavs = useRef(() => {});
  loadFavs.current = () => {
    if (!tokenRef.current) { setUpcomingFavs([]); return; }
    getFavorites()
      .then((list) => {
        const upcoming = list
          .filter((f) => daysUntil(f.date) !== null)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 12);
        setUpcomingFavs(upcoming);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!sidebar) return;
    loadFavs.current();
  }, [sidebar, token]);

  useEffect(() => {
    const handler = (e) => {
      const { type, fav, eventId } = e.detail || {};
      if (type === "add" && fav) {
        const d = daysUntil(fav.date);
        if (d === null) return;
        setUpcomingFavs((prev) =>
          [...prev, fav]
            .filter((f) => daysUntil(f.date) !== null)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 12)
        );
      } else if (type === "remove" && eventId) {
        setUpcomingFavs((prev) => prev.filter((f) => f.eventId !== eventId));
      } else {
        loadFavs.current();
      }
    };
    window.addEventListener("favorites-changed", handler);
    return () => window.removeEventListener("favorites-changed", handler);
  }, []);

  // Refs per leggere lo stato aggiornato dentro il listener senza ricrearlo
  const sidebarRef       = useRef(false);
  const sidebarOutRef    = useRef(false);
  const sidebarActivated = useRef(0);
  useEffect(() => { sidebarRef.current    = sidebar;    }, [sidebar]);
  useEffect(() => { sidebarOutRef.current = sidebarOut; }, [sidebarOut]);

  useEffect(() => {
    function onScroll() {
      const y          = window.scrollY;
      const isMobile = window.innerWidth <= 820;

      if (isMobile) {
        if (y > lastY.current && y > 80) setHidden(true);
        else if (y <= 5) setHidden(false);
      } else {
        setHidden(false);
        if (y > 50 && !sidebarRef.current && !sidebarOutRef.current) {
          sidebarRef.current = true;
          sidebarActivated.current = Date.now();
          setSidebar(true);
          setSidebarOut(false);
          clearTimeout(sidebarTimer.current);
        } else if (y <= 10 && sidebarRef.current && !sidebarOutRef.current && Date.now() - sidebarActivated.current > 800) {
          sidebarOutRef.current = true;
          setSidebarOut(true);
          clearTimeout(sidebarTimer.current);
          sidebarTimer.current = setTimeout(() => {
            sidebarRef.current    = false;
            sidebarOutRef.current = false;
            setSidebar(false);
            setSidebarOut(false);
          }, 360);
        }
      }
      lastY.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Controlla subito: gestisce pagine corte e navigate-back già scrollate
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(sidebarTimer.current);
    };
  }, []); // registrato una volta sola — usa refs per lo stato

  function handleLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    setOpen(false);
    navigate("/home");
  }

  function handleSearch(e) {
    e.preventDefault();
    const city    = cityQ.trim();
    const keyword = searchQ.trim();
    if (!city && !keyword) return;
    const params = new URLSearchParams();
    if (city)    params.set("city", city);
    if (keyword) params.set("q",    keyword);
    navigate(`/home?${params.toString()}`);
    window.dispatchEvent(new CustomEvent("sidebar-search", { detail: { city, keyword } }));
    setCityQ("");
    setSearchQ("");
  }

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " is-active" : "");

  const sidebarClass = sidebar
    ? ` nav--sidebar${sidebarOut ? " nav--sidebar-out" : ""}`
    : "";

  return (
    <nav className={`nav${hidden ? " nav--hidden" : ""}${sidebarClass}`}>

      {/* ── Sidebar layout (desktop, scrolled) ── */}
      {sidebar && (
        <div className="nav__sidebar-inner">
          <Link to="/home" className="brand nav__sidebar-brand" onClick={() => setOpen(false)}>
            <svg width="100" height="24" viewBox="0 0 200 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Setlist">
              <rect x="0" y="4"  width="36" height="5" rx="2.5" fill="#00D48A"/>
              <rect x="0" y="15" width="24" height="5" rx="2.5" fill="#00D48A"/>
              <rect x="0" y="26" width="31" height="5" rx="2.5" fill="#00D48A"/>
              <rect x="0" y="37" width="19" height="5" rx="2.5" fill="#00D48A"/>
              <text x="52" y="38" fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif" fontSize="30" fontWeight="700" fill="#EEF1FF" letterSpacing="-0.8">Setlist</text>
            </svg>
          </Link>

          {/* ── Mini search ── */}
          <p className="nav__section-lbl">Cerca eventi</p>
          <form className="nav__sb-form" onSubmit={handleSearch}>
            <div className="nav__sb-row">
              <PinIcon size={13} />
              <input
                className="nav__sb-input"
                type="text"
                placeholder="Città…"
                value={cityQ}
                onChange={(e) => setCityQ(e.target.value)}
              />
            </div>
            <span className="nav__sb-sep" />
            <div className="nav__sb-row">
              <MusicIcon size={13} />
              <input
                className="nav__sb-input"
                type="text"
                placeholder="Artista o evento…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>
            <button type="submit" className="nav__sb-go">
              <SearchIcon size={13} />Cerca
            </button>
          </form>

          <p className="nav__section-lbl">Naviga</p>
          <nav className="nav__sidebar-links" aria-label="Navigazione principale">
            <NavLink to="/home" className={linkClass}>
              <MusicIcon size={18} />
              Esplora
            </NavLink>
            <NavLink to="/favorites" className={linkClass}>
              <HeartIcon size={18} />
              My List
            </NavLink>
            {token && (
              <NavLink to="/profile" className={linkClass}>
                <UserIcon size={18} />
                Profilo
              </NavLink>
            )}
          </nav>

          {/* ── Preferiti in arrivo ── */}
          {token && (
            <div className="nav__favs">
              <div className="nav__favs-label">In arrivo</div>
              {upcomingFavs.length === 0 ? (
                <p className="nav__favs-empty">Nessun evento salvato</p>
              ) : (
                upcomingFavs.map((f, i) => {
                  const d = daysUntil(f.date);
                  return (
                    <Link
                      key={f.eventId}
                      to={`/event/${f.eventId}`}
                      className={`nav__fav${i === 0 ? " nav__fav--next" : ""}`}
                    >
                      {f.image && <img src={f.image} alt={f.name} className="nav__fav-img" />}
                      <div className="nav__fav-body">
                        <div className="nav__fav-name">{f.name}</div>
                        <div className="nav__fav-meta">
                          {f.city && <span>{f.city}</span>}
                          <span className="nav__fav-days">
                            {d === 0 ? "oggi" : `${d}g`}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          <div className="nav__sidebar-foot">
            {!token ? (
              <NavLink to="/login" className="btn btn--primary btn--sm btn--block">
                <UserIcon size={18} />
                Accedi
              </NavLink>
            ) : (
              <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={handleLogout}>
                Esci
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Top bar layout (default) ── */}
      {!sidebar && (
        <>
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
              <NavLink to="/home" className={linkClass} onClick={() => setOpen(false)}>
                <MusicIcon size={18} />
                Esplora
              </NavLink>
              <NavLink to="/favorites" className={linkClass} onClick={() => setOpen(false)}>
                <HeartIcon size={18} />
                My List
              </NavLink>

              {!token ? (
                <NavLink to="/login" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
                  <UserIcon size={18} />
                  Accedi
                </NavLink>
              ) : (
                <>
                  <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                    <UserIcon size={18} />
                    Il mio profilo
                  </NavLink>
                  <button type="button" className="btn btn--ghost btn--block" onClick={handleLogout}>
                    Esci
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
