import { useState, useEffect } from "react";
import { toast } from "sonner";
import { addFavorite, removeFavorite, getFavorites } from "../lib/api";

export function useEventFavorite(id, ev) {
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token") || !id) return;
    getFavorites()
      .then((list) => {
        const found = list.find((f) => f.eventId === id);
        if (found) { setIsFav(true); setFavId(found._id); }
      })
      .catch(() => {});
  }, [id]);

  async function toggle() {
    if (!localStorage.getItem("token")) {
      toast.error("Accedi per salvare questo evento.");
      return;
    }
    try {
      if (isFav && favId) {
        await removeFavorite(favId);
        setIsFav(false);
        setFavId(null);
        toast("Rimosso dai preferiti.");
        window.dispatchEvent(new Event("favorites-changed"));
      } else if (ev) {
        const created = await addFavorite({
          eventId: ev.id, name: ev.name, image: ev.image,
          date: ev.date, venue: ev.venue?.name, city: ev.venue?.city, url: ev.url, genre: ev.genre,
        });
        setIsFav(true);
        setFavId(created._id);
        toast.success("Aggiunto ai preferiti!");
        window.dispatchEvent(new Event("favorites-changed"));
      }
    } catch (e) {
      toast.error(e.message || "Errore.");
    }
  }

  return { isFav, toggle };
}
