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

  const mapsSearch = (item) =>
    item.lat
      ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`;

  return (
    <div id="section-dove" className="ed-section ed-stack">

      {(weather?.status === "ok" || hasGeo) && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><PinIcon size={13} /> Sul posto</span>
              <h3 className="ed-block__title">Meteo e come arrivare</h3>
            </div>
            {gdir && (
              <a href={gdir} target="_blank" rel="noreferrer" className="ed-block__cta">
                Indicazioni<ArrowRightIcon size={14} />
              </a>
            )}
          </div>

          <div className="ed-place">
            {weather?.status === "ok" && (
              <div className="ed-wx">
                <span className="ed-wx__icon" aria-hidden="true">{weather.icon}</span>
                <div className="ed-wx__body">
                  <div className="ed-wx__temp">{weather.tMax}° <span>/ {weather.tMin}°</span></div>
                  <div className="ed-wx__desc">{weather.desc}</div>
                  <div className="ed-wx__meta">
                    <span>💧 {weather.precip}% pioggia</span>
                    <span>💨 {weather.wind} km/h</span>
                  </div>
                </div>
              </div>
            )}

            {hasGeo && (
              <div className="ed-mapwrap">
                {showMap ? (
                  <iframe title="Mappa del venue" className="ed-mapwrap__frame" src={osmSrc} />
                ) : (
                  <button type="button" className="ed-mapwrap__cta" onClick={() => setShowMap(true)}>
                    <PinIcon size={26} />
                    <span>Mostra mappa</span>
                    {(v.address || v.city) && <small>{[v.address, v.city].filter(Boolean).join(" · ")}</small>}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {(parks.length > 0 || restaurants.length > 0 || parkings.length > 0) && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><TreeIcon size={13} /> Dintorni</span>
              <h3 className="ed-block__title">Cosa c'è intorno al venue</h3>
            </div>
          </div>
          <div className="ed-cols">
            {parks.length > 0 && (
              <div className="ed-col">
                <div className="ed-col__head"><TreeIcon size={15} />Parchi e verde</div>
                <ul className="ed-col__list">
                  {parks.map((p) => (
                    <li key={p.id}>
                      <a href={`https://www.openstreetmap.org/${p.type}/${p.id}`} target="_blank" rel="noreferrer" className="ed-col__row">
                        <span>{p.name}</span><ArrowRightIcon size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {restaurants.length > 0 && (
              <div className="ed-col">
                <div className="ed-col__head"><ForkIcon size={15} />Dove mangiare</div>
                <ul className="ed-col__list">
                  {restaurants.map((r) => (
                    <li key={r.id}>
                      <a href={mapsSearch(r)} target="_blank" rel="noreferrer" className="ed-col__row">
                        <span>{r.name}</span>
                        <small className="ed-col__tag">{r.type === "fast_food" ? "fast food" : r.type}</small>
                        <ArrowRightIcon size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parkings.length > 0 && (
              <div className="ed-col">
                <div className="ed-col__head"><PinIcon size={15} />Dove parcheggiare</div>
                <ul className="ed-col__list">
                  {parkings.map((p) => (
                    <li key={p.id}>
                      <a href={mapsSearch(p)} target="_blank" rel="noreferrer" className="ed-col__row">
                        <span>{p.name}</span><ArrowRightIcon size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {(bookingUrl || airbnbUrl || hasGeo) && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><BedIcon size={13} /> Logistica</span>
              <h3 className="ed-block__title">Dormi e spostati</h3>
            </div>
          </div>
          <div className="ed-svc">
            {bookingUrl && (
              <a href={bookingUrl} target="_blank" rel="noreferrer" className="ed-svc__card">
                <div className="ed-svc__icon"><BedIcon size={20} /></div>
                <div className="ed-svc__txt">
                  <div className="ed-svc__title">Booking.com</div>
                  <div className="ed-svc__sub">Hotel, B&amp;B e appartamenti</div>
                </div>
                <ArrowRightIcon size={16} />
              </a>
            )}
            {airbnbUrl && (
              <a href={airbnbUrl} target="_blank" rel="noreferrer" className="ed-svc__card">
                <div className="ed-svc__icon"><GlobeIcon size={20} /></div>
                <div className="ed-svc__txt">
                  <div className="ed-svc__title">Airbnb</div>
                  <div className="ed-svc__sub">Case e stanze a {v.city || "destinazione"}</div>
                </div>
                <ArrowRightIcon size={16} />
              </a>
            )}
            {hasGeo && (
              <>
                <a href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${v.lat}&dropoff[longitude]=${v.lon}&dropoff[nickname]=${encodeURIComponent(v.name || "Venue")}`} target="_blank" rel="noreferrer" className="ed-svc__card">
                  <div className="ed-svc__icon ed-svc__icon--dark">Ub</div>
                  <div className="ed-svc__txt">
                    <div className="ed-svc__title">Uber</div>
                    <div className="ed-svc__sub">Prenota un passaggio</div>
                  </div>
                  <ArrowRightIcon size={16} />
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}&travelmode=transit`} target="_blank" rel="noreferrer" className="ed-svc__card">
                  <div className="ed-svc__icon ed-svc__icon--bus">BUS</div>
                  <div className="ed-svc__txt">
                    <div className="ed-svc__title">Trasporto pubblico</div>
                    <div className="ed-svc__sub">Indicazioni con Google Maps</div>
                  </div>
                  <ArrowRightIcon size={16} />
                </a>
                <a href="https://free-now.com" target="_blank" rel="noreferrer" className="ed-svc__card">
                  <div className="ed-svc__icon ed-svc__icon--free">FREE</div>
                  <div className="ed-svc__txt">
                    <div className="ed-svc__title">FREE NOW</div>
                    <div className="ed-svc__sub">Taxi e NCC</div>
                  </div>
                  <ArrowRightIcon size={16} />
                </a>
              </>
            )}
          </div>
        </section>
      )}

      {cityInfo && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><GlobeIcon size={13} /> La città</span>
              <h3 className="ed-block__title">{cityInfo.title}</h3>
            </div>
          </div>
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
        </section>
      )}

      <div className="ed-plan__grid">
        <BudgetEstimate ev={ev} />
        <ConcertChecklist ev={ev} />
      </div>
    </div>
  );
}
