// frontend/src/components/EventsMosaicBg.jsx

// Sfondo mosaico: usa le locandine degli eventi già caricate per creare
// una griglia fotografica scura e lentamente animata, a tema concerti.

export default function EventsMosaicBg({ events }) {
  const raw = events.filter((ev) => ev.image).map((ev) => ev.image);
  if (raw.length < 3) return null;

  // Riempi fino a 12 riciclando le immagini disponibili
  const images = [];
  while (images.length < 12) {
    images.push(...raw.slice(0, 12 - images.length));
  }

  return (
    <div className="mosaic-bg" aria-hidden="true">
      <div className="mosaic-bg__grid">
        {images.slice(0, 12).map((src, i) => (
          <div key={i} className="mosaic-bg__cell">
            <img src={src} alt="" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      {/* overlay scuro centrale per leggibilità del testo */}
      <div className="mosaic-bg__overlay" />
    </div>
  );
}
