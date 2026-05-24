import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  searchEvents, toUtcStart, toUtcEnd,
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
    start:   searchParams.get("start") || "",
    end:     searchParams.get("end")   || "",
    size: 12,
    page: parseInt(searchParams.get("page") || "0", 10),
  });

  const [data, setData] = useState({ events: [], totalPages: 1, page: 0, totalElements: 0 });
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [citySugg,     setCitySugg]     = useState([]);
  const [showCitySugg, setShowCitySugg] = useState(false);
  const [quickRange,   setQuickRange]   = useState(null);
  const [favMap,       setFavMap]       = useState({});

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
      } catch (e) { toast.error(e.message || "Non è stato possibile rimuovere il preferito."); }
      return;
    }
    try {
      const created = await addFavorite({
        eventId: ev.id, name: ev.name, image: ev.image,
        date: ev.date, venue: ev.venue, city: ev.city, url: ev.url,
      });
      setFavMap((m) => ({ ...m, [ev.id]: created._id }));
      toast.success(`"${ev.name}" aggiunto ai preferiti`);
    } catch (e) { toast.error(e.message || "Non è stato possibile salvare il preferito."); }
  }

  function update(p) { setForm((f) => ({ ...f, ...p })); }

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

  async function runSearch(page = 0, overrideForm) {
    setLoading(true);
    setError("");
    const usedForm = overrideForm ?? { ...form, page };
    try {
      const res = await searchEvents({
        city: usedForm.city, keyword: usedForm.keyword,
        size: usedForm.size, page,
        start: toUtcStart(usedForm.start), end: toUtcEnd(usedForm.end),
      });
      const seen = new Set();
      const uniqueEvents = [];
      for (const ev of res.events || []) {
        if (!seen.has(ev.id)) { seen.add(ev.id); uniqueEvents.push(ev); }
      }
      setData({ ...res, events: uniqueEvents });
      setForm((f) => ({ ...f, page: res.page ?? page }));
      updateURL(usedForm, res.page ?? page);
    } catch {
      setError("Non siamo riusciti a caricare gli eventi in questo momento. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(form.page || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch silenzioso dopo 7s per aggiornare sold out/status dal background enrichment
  useEffect(() => {
    const tid = setTimeout(() => {
      const f = form;
      searchEvents({
        city: f.city, keyword: f.keyword,
        size: f.size, page: f.page || 0,
        start: toUtcStart(f.start), end: toUtcEnd(f.end),
      }).then((res) => {
        const seen = new Set();
        const uniqueEvents = [];
        for (const ev of res.events || []) {
          if (!seen.has(ev.id)) { seen.add(ev.id); uniqueEvents.push(ev); }
        }
        setData((prev) => ({ ...prev, events: uniqueEvents }));
      }).catch(() => {});
    }, 7000);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const city = form.city.trim();
    if (city.length < 2) { setCitySugg([]); return; }
    const tid = setTimeout(() => {
      searchEvents({ city, size: 6 })
        .then((res) => {
          const cities = [...new Set((res.events || []).map((e) => e.city).filter(Boolean))].slice(0, 5);
          setCitySugg(cities);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city]);

  async function goToPage(p) {
    await runSearch(p);
    document.getElementById("risultati")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToSearch() {
    document.getElementById("ricerca")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasResults       = data.events?.length > 0;
  const hasActiveFilters = Boolean(form.start || form.end || quickRange);
  const isShowcase       = !form.city && !form.keyword && !form.start && !form.end && !quickRange;

  return {
    form, update, data, loading, error,
    citySugg, showCitySugg, setShowCitySugg,
    quickRange, applyQuickRange, clearDates,
    runSearch, goToPage, scrollToSearch,
    favMap, toggleFavorite,
    hasResults, hasActiveFilters, isShowcase,
  };
}
