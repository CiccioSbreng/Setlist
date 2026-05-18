import { useState } from "react";
import {
  ArrowRightIcon, BedIcon, CloudIcon, ForkIcon,
  GlobeIcon, PinIcon, TreeIcon,
} from "./Icons";
import BudgetEstimate from "./BudgetEstimate";
import ConcertChecklist from "./ConcertChecklist";

export default function VenueSection({ ev, weather, parks, restaurants, parkings, cityInfo }) {
  const [showMap, setShowMap] = useState(false);

  const v      = ev.venue || {};
  const hasGeo = v.lat != null && v.lon != null;
  const d      = 0.008;

  const osmSrc = hasGeo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${v.lon - d}%2C${v.lat - d}%2C${v.lon + d}%2C${v.lat + d}&layer=mapnik&marker=${v.lat}%2C${v.lon}`
    : null;
  const gdir = hasGeo ? `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}` : null;

  const checkin  = ev.date ? ev.date.slice(0, 10) : null;
  const checkout = (() => {
    if (!checkin) return null;
    const dt = new Date(`${checkin}T12:00:00`);
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().slice(0, 10);
  })();
  const bookingUrl = v.city
    ? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(v.city)}${checkin ? `&checkin=${checkin}&checkout=${checkout}` : ""}`
    : null;
  const airbnbUrl = v.city
    ? `https://www.airbnb.it/s/${encodeURIComponent(v.city)}/homes${checkin ? `?checkin=${checkin}&checkout=${checkout}` : ""}`
    : null;

  return (
    <div id="section-dove" className="ed-section">
      <div className="ed-grid4">

        {weather?.status === "ok" && (
          <div className="ed-tile">
            <div className="ed-tile__head"><CloudIcon size={16} /><span>Meteo del concerto</span></div>
            <div className="ed-wx">
              <div className="ed-wx__main">
                <span className="ed-wx__icon" aria-hidden="true">{weather.icon}</span>
                <div>
                  <div className="ed-wx__temp">{weather.tMax}° <span>/ {weather.tMin}°</span></div>
                  <div className="ed-wx__desc">{weather.desc}</div>
                </div>
              </div>
              <div className="ed-wx__meta">
                <span>💧 {weather.precip}% pioggia</span>
                <span>💨 {weather.wind} km/h</span>
              </div>
            </div>
          </div>
        )}

        {hasGeo && (
          <div className="ed-tile">
            <div className="ed-tile__head">
              <PinIcon size={16} /><span>Come arrivare</span>
              <div className="ed-tile__links">
                <a href={gdir} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">Indicazioni</a>
              </div>
            </div>
            {showMap ? (
              <iframe title="Mappa del venue" className="ed-tile__map" src={osmSrc} />
            ) : (
              <button type="button" className="ed-tile__map-preview" onClick={() => setShowMap(true)}>
                <PinIcon size={24} />
                <span>Mostra mappa</span>
                {(v.address || v.city) && <small>{[v.address, v.city].filter(Boolean).join(" · ")}</small>}
              </button>
            )}
          </div>
        )}

        {parks.length > 0 && (
          <div className="ed-tile">
            <div className="ed-tile__head"><TreeIcon size={16} /><span>Parchi e verde</span></div>
            <ul className="ed-tile__list">
              {parks.map((p) => (
                <li key={p.id}>
                  <a href={`https://www.openstreetmap.org/${p.type}/${p.id}`} target="_blank" rel="noreferrer" className="ed-tile__row">
                    <TreeIcon size={14} /><span>{p.name}</span><ArrowRightIcon size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {restaurants.length > 0 && (
          <div className="ed-tile">
            <div className="ed-tile__head"><ForkIcon size={16} /><span>Dove mangiare</span></div>
            <ul className="ed-tile__list">
              {restaurants.map((r) => (
                <li key={r.id}>
                  <a
                    href={r.lat ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}`}
                    target="_blank" rel="noreferrer" className="ed-tile__row"
                  >
                    <ForkIcon size={14} />
                    <span>{r.name}</span>
                    <small className="ed-tile__tag">{r.type === "fast_food" ? "fast food" : r.type}</small>
                    <ArrowRightIcon size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parkings.length > 0 && (
          <div className="ed-tile">
            <div className="ed-tile__head"><PinIcon size={16} /><span>Dove parcheggiare</span></div>
            <ul className="ed-tile__list">
              {parkings.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.lat ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}
                    target="_blank" rel="noreferrer" className="ed-tile__row"
                  >
                    <PinIcon size={14} /><span>{p.name}</span><ArrowRightIcon size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(bookingUrl || airbnbUrl) && (
          <div className="ed-tile">
            <div className="ed-tile__head"><BedIcon size={16} /><span>Dove dormire</span></div>
            <div className="ed-tile__sleep">
              {bookingUrl && (
                <a href={bookingUrl} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                  <div className="ed-tile__sleep-icon"><BedIcon size={20} /></div>
                  <div>
                    <div className="ed-tile__sleep-title">Booking.com</div>
                    <div className="ed-tile__sleep-sub">Hotel, B&amp;B e appartamenti</div>
                  </div>
                  <ArrowRightIcon size={16} />
                </a>
              )}
              {airbnbUrl && (
                <a href={airbnbUrl} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                  <div className="ed-tile__sleep-icon"><GlobeIcon size={20} /></div>
                  <div>
                    <div className="ed-tile__sleep-title">Airbnb</div>
                    <div className="ed-tile__sleep-sub">Case e stanze a {v.city || "destinazione"}</div>
                  </div>
                  <ArrowRightIcon size={16} />
                </a>
              )}
            </div>
          </div>
        )}

        {hasGeo && (
          <div className="ed-tile">
            <div className="ed-tile__head"><GlobeIcon size={16} /><span>Come spostarsi</span></div>
            <div className="ed-tile__sleep">
              <a href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${v.lat}&dropoff[longitude]=${v.lon}&dropoff[nickname]=${encodeURIComponent(v.name || "Venue")}`} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                <div className="ed-tile__sleep-icon" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.03em" }}>Ub</span>
                </div>
                <div>
                  <div className="ed-tile__sleep-title">Uber</div>
                  <div className="ed-tile__sleep-sub">Prenota un passaggio</div>
                </div>
                <ArrowRightIcon size={16} />
              </a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}&travelmode=transit`} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                <div className="ed-tile__sleep-icon" style={{ background: "rgba(66,133,244,0.15)" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "#4285f4" }}>BUS</span>
                </div>
                <div>
                  <div className="ed-tile__sleep-title">Trasporto pubblico</div>
                  <div className="ed-tile__sleep-sub">Indicazioni con Google Maps</div>
                </div>
                <ArrowRightIcon size={16} />
              </a>
              <a href="https://free-now.com" target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                <div className="ed-tile__sleep-icon" style={{ background: "rgba(255,220,0,0.15)" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.7rem", color: "#f5c800" }}>FREE</span>
                </div>
                <div>
                  <div className="ed-tile__sleep-title">FREE NOW</div>
                  <div className="ed-tile__sleep-sub">Taxi e NCC</div>
                </div>
                <ArrowRightIcon size={16} />
              </a>
            </div>
          </div>
        )}
      </div>

      {cityInfo && (
        <div className="ed-card ed-cityinfo">
          <div className="ed-tile__head"><GlobeIcon size={16} /><span>La città: {cityInfo.title}</span></div>
          <div className="ed-cityinfo__body">
            {cityInfo.thumb && <img src={cityInfo.thumb} alt={cityInfo.title} loading="lazy" />}
            <div>
              <p>{cityInfo.extract}</p>
              {cityInfo.url && (
                <a href={cityInfo.url} target="_blank" rel="noreferrer" className="ed-cityinfo__more">
                  Approfondisci su Wikipedia <ArrowRightIcon size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="ed-plan__grid">
        <BudgetEstimate ev={ev} />
        <ConcertChecklist ev={ev} />
      </div>
    </div>
  );
}
