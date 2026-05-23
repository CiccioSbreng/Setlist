import { useEffect, useRef } from "react";

export default function SpotlightCursor() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = null;
    let cx = -9999, cy = -9999;

    function onMove(e) {
      cx = e.clientX;
      cy = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${cx}px,${cy}px)`;
          raf = null;
        });
      }
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="spotlight-cursor" aria-hidden="true" />;
}
