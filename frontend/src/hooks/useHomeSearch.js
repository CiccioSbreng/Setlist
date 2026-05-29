import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const CITY_LIST = [
  // Italia
  "Roma","Milano","Napoli","Torino","Palermo","Genova","Bologna","Firenze",
  "Bari","Catania","Venezia","Verona","Messina","Padova","Trieste","Brescia",
  "Parma","Modena","Perugia","Livorno","Cagliari","Foggia","Rimini","Salerno",
  "Ferrara","Bergamo","Pescara","Trento","Vicenza","Ancona","Lecce","Bolzano",
  "Novara","Piacenza","Arezzo","Udine","Cesena","Pisa","Monza","Varese",
  "Como","Reggio Calabria","Reggio Emilia","Cosenza","Brindisi","Caserta",
  "Sassari","Siracusa","Latina","Taranto","La Spezia","Mantova","Lucca",
  "Terni","Ravenna","Forlì","Sesto San Giovanni","Catanzaro","Ragusa",
  // Europa (nomi italiani → gestiti da CITY_LL nel backend)
  "Parigi","Londra","Berlino","Monaco","Amburgo","Madrid","Barcellona",
  "Lisbona","Bruxelles","Amsterdam","Vienna","Zurigo","Ginevra","Praga",
  "Varsavia","Budapest","Bucarest","Atene","Stoccolma","Oslo","Copenaghen",
  "Helsinki","Dublino","Siviglia","Valencia","Bilbao","Porto","Cracovia",
  "Francoforte","Colonia","Stoccarda","Amburgo","Salisburgo","Basilea",
  "Rotterdam","Anversa","Göteborg","Belgrado","Zagabria","Lubiana","Sofia",
  "Salonicco","Lione","Marsiglia","Bordeaux","Tolosa",
];
import { toast } from "sonner";
import {
  searchEvents, searchAttractions, toUtcStart, toUtcEnd,
  addFavorite, getFavorites, removeFavorite,
} from "../lib/api";

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useHomeSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [form, setForm] = useState({
    city:    searchParams.get("city")  || "",
    keyword: searchParams.get("q")     || "",
    genre:   searchParams.get("genre") || "",
    start:   searchParams.get("start") || "",
    end:     searchParams.get("end")   || "",
    size: 12,
    page: parseInt(searchParams.get("page") || "0", 10),
  });

  const [data, setData] = useState({ events: [], totalPages: 1, page: 0, totalElements: 0 });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [citySugg,      setCitySugg]      = useState([]);
  const [showCitySugg,  setShowCitySugg]  = useState(false);
  const [artistSugg,    setArtistSugg]    = useState([]);
  const [showArtistSugg, setShowArtistSugg] = useState(false);
  const [quickRange,   setQuickRange]   = useState(null);
  const [favMap,       setFavMap]       = useState({});
  const searchSeq = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getFavorites()
      .then((list) => {
        const m = {};
        for (const f of list) m[f.eventId] = f._id;
        setFavMap(m);
      })
      .catch(() => {});
  }, []);

  function updateURL(f, page) {
    const p = {};
    if (f.city)    p.city  = f.city;
    if (f.keyword) p.q     = f.keyword;
    if (f.genre)   p.genre = f.genre;
    if (f.start)   p.start = f.start;
    if (f.end)     p.end   = f.end;
    if (page > 0)  p.page  = String(page);
    setSearchParams(p, { replace: true });
  }

  async function toggleFavorite(ev) {
    if (!localStorage.getItem("token")) {
      toast.error("Per salvare un evento devi prima accedere o registrarti.");
      return;
    }
    const favId = favMap[ev.id];
    if (favId) {
      try {
        await removeFavorite(favId);
        setFavMap((m) => { const next = { ...m }; delete next[ev.id]; return next; });
        toast(`"${ev.name}" rimosso dai preferiti`);
        window.dispatchEvent(new CustomEvent("favorites-changed", { detail: { type: "remove", eventId: ev.id } }));
      } catch (e) { toast.error(e.message || "Non è stato possibile rimuovere il preferito."); }
      return;
    }
    try {
      const created = await addFavorite({
        eventId: ev.id, name: ev.name, image: ev.image,
        date: ev.date, venue: ev.venue, city: ev.city, url: ev.url, genre: ev.genre,
      });
      setFavMap((m) => ({ ...m, [ev.id]: created._id }));
      toast.success(`"${ev.name}" aggiunto ai preferiti`);
      window.dispatchEvent(new CustomEvent("favorites-changed", {
        detail: { type: "add", fav: { eventId: ev.id, name: ev.name, image: ev.image, date: ev.date, city: ev.city } },
      }));
    } catch (e) { toast.error(e.message || "Non è stato possibile salvare il preferito."); }
  }

  function update(p) { setForm((f) => ({ ...f, ...p })); }

  function applyGenre(g) {
    const next = { ...form, genre: form.genre === g ? "" : g, page: 0 };
    setForm(next);
    runSearch(0, next);
  }

  function applyQuickRange(id) {
    const now = new Date();
    let startDate = null, endDate = null;
    if (id === "today") { startDate = now; endDate = now; }
    else if (id === "week") {
      const diffToMonday = (now.getDay() + 6) % 7;
      const monday = new Date(now); monday.setDate(now.getDate() - diffToMonday);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      startDate = monday; endDate = sunday;
    } else if (id === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    if (!startDate || !endDate) return;
    setQuickRange(id);
    setForm((f) => ({ ...f, start: formatDate(startDate), end: formatDate(endDate), page: 0 }));
  }

  function clearDates() {
    setQuickRange(null);
    const cleared = { ...form, start: "", end: "", page: 0 };
    setForm(cleared);
    runSearch(0, cleared);
  }

  function clearSearch() {
    setQuickRange(null);
    const cleared = { ...form, city: "", keyword: "", genre: "", start: "", end: "", page: 0 };
    setForm(cleared);
    runSearch(0, cleared);
  }

  async function runSearch(page = 0, overrideForm) {
    const seq = ++searchSeq.current;
    setLoading(true);
    setError("");
    const usedForm = overrideForm ?? { ...form, page };
    const params = {
      city: usedForm.city, keyword: usedForm.keyword,
      genre: usedForm.genre,
      size: usedForm.size, page,
      start: toUtcStart(usedForm.start), end: toUtcEnd(usedForm.end),
    };
    try {
      const res = await searchEvents(params);
      if (seq !== searchSeq.current) return;
      const seen = new Set();
      const uniqueEvents = [];
      for (const ev of res.events || []) {
        if (!seen.has(ev.id)) { seen.add(ev.id); uniqueEvents.push(ev); }
      }
      setData({ ...res, events: uniqueEvents });
      setForm((f) => ({ ...f, page: res.page ?? page }));
      updateURL(usedForm, res.page ?? page);
    } catch {
      if (seq !== searchSeq.current) return;
      setError("Non siamo riusciti a caricare gli eventi in questo momento. Riprova tra poco.");
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(form.page || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onSidebarSearch(e) {
      const q = e.detail?.q?.trim() || "";
      if (!q) return;
      const isCity = CITY_LIST.some((c) => c.toLowerCase() === q.toLowerCase());
      const next = isCity
        ? { city: q, keyword: "", genre: "", start: "", end: "", size: 12, page: 0 }
        : { city: "", keyword: q, genre: "", start: "", end: "", size: 12, page: 0 };
      setForm(next);
      runSearch(0, next);
    }
    window.addEventListener("sidebar-search", onSidebarSearch);
    return () => window.removeEventListener("sidebar-search", onSidebarSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const city = form.city.trim();
    if (!city) { setCitySugg([]); return; }
    const q = city.toLowerCase();
    const matches = CITY_LIST.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 6);
    setCitySugg(matches);
  }, [form.city]);

  useEffect(() => {
    const kw = form.keyword.trim();
    if (kw.length < 2) { setArtistSugg([]); return; }
    const tid = setTimeout(() => {
      searchAttractions(kw).then(setArtistSugg).catch(() => {});
    }, 280);
    return () => clearTimeout(tid);
  }, [form.keyword]);

  async function goToPage(p) {
    await runSearch(p);
    document.getElementById("risultati")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToSearch() {
    document.getElementById("ricerca")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const SHOW_AFTER_START_MS = 90 * 60 * 1000; // 90 minuti
  const visibleEvents = (data.events || []).filter(ev => {
    if (!ev.date) return true;
    const start = new Date(ev.date.includes('T') ? ev.date : `${ev.date}T${ev.time || '20:00:00'}`).getTime();
    if (start > now) return true;
    return now - start < SHOW_AFTER_START_MS;
  });

  const hasResults       = visibleEvents.length > 0;
  const hasActiveFilters = Boolean(form.start || form.end || quickRange);
  const hasSearch        = Boolean(form.city || form.keyword || form.genre || form.start || form.end || quickRange);
  const isShowcase       = !form.city && !form.keyword && !form.genre && !form.start && !form.end && !quickRange;

  return {
    form, update, data, visibleEvents, loading, error,
    citySugg, showCitySugg, setShowCitySugg,
    artistSugg, showArtistSugg, setShowArtistSugg,
    applyGenre, clearDates, clearSearch,
    runSearch, goToPage, scrollToSearch,
    favMap, toggleFavorite,
    hasResults, hasActiveFilters, hasSearch, isShowcase,
  };
}
