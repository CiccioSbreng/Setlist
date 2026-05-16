// frontend/src/pages/Legal.jsx

import { Link } from "react-router-dom";

const DOCS = {
  privacy: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: maggio 2026",
    blocks: [
      [
        "Chi siamo",
        "ConcertHub è un progetto dimostrativo che aggrega eventi musicali e informazioni sugli artisti da servizi di terze parti. Non è un servizio commerciale e non vende biglietti direttamente.",
      ],
      [
        "Dati che raccogliamo",
        "Se crei un account, conserviamo la tua email e una versione cifrata (hash) della password. Se salvi eventi tra i preferiti, memorizziamo l'elenco associato al tuo account. Non raccogliamo altri dati personali.",
      ],
      [
        "Come usiamo i dati",
        "I dati servono unicamente a far funzionare l'autenticazione e la lista preferiti. Non vendiamo né cediamo i tuoi dati a terzi e non li usiamo per profilazione o marketing.",
      ],
      [
        "Servizi di terze parti",
        "Le informazioni su eventi e artisti provengono da Ticketmaster, Spotify, YouTube e Wikipedia. Consultando queste sezioni si applicano anche le rispettive informative.",
      ],
      [
        "I tuoi diritti",
        "Puoi richiedere in qualsiasi momento la cancellazione del tuo account e dei dati associati contattandoci.",
      ],
    ],
  },
  termini: {
    title: "Termini di Servizio",
    updated: "Ultimo aggiornamento: maggio 2026",
    blocks: [
      [
        "Natura del servizio",
        "ConcertHub è un progetto a scopo dimostrativo e di portfolio. Il servizio è fornito \"così com'è\", senza garanzie di disponibilità continuativa o di accuratezza dei dati.",
      ],
      [
        "Acquisto biglietti",
        "ConcertHub non vende biglietti. I link \"Biglietti\" reindirizzano a Ticketmaster: ogni acquisto avviene sul loro sito e secondo le loro condizioni.",
      ],
      [
        "Account utente",
        "Sei responsabile della riservatezza delle tue credenziali. Ci riserviamo il diritto di sospendere account usati in modo improprio.",
      ],
      [
        "Limitazione di responsabilità",
        "Non siamo responsabili per eventi annullati, modificati o per inesattezze nei dati forniti dai servizi di terze parti.",
      ],
    ],
  },
  cookie: {
    title: "Cookie Policy",
    updated: "Ultimo aggiornamento: maggio 2026",
    blocks: [
      [
        "Cosa usiamo",
        "ConcertHub non utilizza cookie di tracciamento, analitici o di marketing.",
      ],
      [
        "Archiviazione locale",
        "Per mantenere attiva la tua sessione usiamo esclusivamente il localStorage del browser, dove viene salvato il token di autenticazione. Questo dato resta sul tuo dispositivo e non viene condiviso.",
      ],
      [
        "Gestione",
        "Effettuando il logout o svuotando i dati del browser rimuovi completamente queste informazioni.",
      ],
    ],
  },
};

export default function Legal({ doc }) {
  const data = DOCS[doc];
  if (!data) return null;

  return (
    <section className="section">
      <div className="wrap">
        <div className="legal">
          <Link to="/home" className="ed-back">
            ← Torna alla home
          </Link>
          <h1 className="legal__title">{data.title}</h1>
          <p className="legal__updated">{data.updated}</p>

          {data.blocks.map(([heading, text]) => (
            <div className="legal__block" key={heading}>
              <h2>{heading}</h2>
              <p>{text}</p>
            </div>
          ))}

          <p className="legal__note">
            Questo è un progetto dimostrativo. Per qualsiasi richiesta relativa
            ai dati, contatta l'autore del progetto.
          </p>
        </div>
      </div>
    </section>
  );
}
