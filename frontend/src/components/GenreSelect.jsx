import { useEffect, useRef, useState } from "react";
import { MusicIcon, ChevronDownIcon, CloseIcon } from "./Icons";

const GENRES = [
  "Rock", "Pop", "Metal", "Hip-Hop/Rap",
  "Electronic", "Punk", "R&B", "Alternative",
];

export default function GenreSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(g) {
    onChange(value === g ? "" : g);
    setOpen(false);
  }

  return (
    <div className="gsel" ref={wrapRef}>
      <button
        type="button"
        className={"gsel__trigger" + (value ? " is-active" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MusicIcon size={18} className="gsel__ic" />
        <span className="gsel__label">{value || "Tutti i generi"}</span>
        {value
          ? <CloseIcon size={14} className="gsel__clear" onClick={(e) => { e.stopPropagation(); onChange(""); }} />
          : <ChevronDownIcon size={14} className={"gsel__arrow" + (open ? " is-open" : "")} />
        }
      </button>

      {open && (
        <ul className="gsel__pop" role="listbox" aria-label="Seleziona genere">
          {GENRES.map((g) => (
            <li key={g} role="option" aria-selected={value === g}>
              <button
                type="button"
                className={"gsel__opt" + (value === g ? " is-active" : "")}
                onMouseDown={() => select(g)}
              >
                {g}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
