// frontend/src/components/AmbientBackground.jsx

import { useEffect, useRef } from "react";

// Sfondo ambientale: spotlight che segue il cursore (come un faretto da palco)
// + bokeh di luci sfocate che derivano lente. Aurora gestita in CSS (body::before/after).
export default function AmbientBackground() {
  const spotRef = useRef(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;

    // Rispetta chi preferisce meno animazioni
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.35;
    let x = tx;
    let y = ty;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const tick = () => {
      // easing morbido verso la posizione del cursore
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__bokeh">
        <span className="ambient__orb ambient__orb--1" />
        <span className="ambient__orb ambient__orb--2" />
        <span className="ambient__orb ambient__orb--3" />
        <span className="ambient__orb ambient__orb--4" />
        <span className="ambient__orb ambient__orb--5" />
      </div>
      <div ref={spotRef} className="ambient__spot" />
    </div>
  );
}
