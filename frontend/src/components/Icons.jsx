// frontend/src/components/Icons.jsx
// Set di icone SVG inline: nessuna dipendenza esterna, stile coerente.

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ size, children, ...rest }) {
  const dim = size || 20;
  return (
    <svg {...base} width={dim} height={dim} aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 3v3M16 3v3" />
  </Svg>
);

export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.3 4.6 13a4.8 4.8 0 0 1 6.8-6.8l.6.6.6-.6A4.8 4.8 0 1 1 19.4 13Z" />
  </Svg>
);

export const TicketIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5a2 2 0 0 0 0 4 2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 12.5a2 2 0 0 0 0-4Z" />
    <path d="M13 6v12" strokeDasharray="2 2.4" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2" />
  </Svg>
);

export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);

export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (p) => (
  <Svg {...p}>
    <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3 3.6M6.4 7.9A16 16 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.4-.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const SparkIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </Svg>
);

export const MusicIcon = (p) => (
  <Svg {...p}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6" cy="18" r="2.6" />
    <circle cx="16" cy="16" r="2.6" />
  </Svg>
);

export const GlobeIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17" />
  </Svg>
);

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const RefreshIcon = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />
  </Svg>
);

export const TreeIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3 4.5 13H9v8h6v-8h4.5L12 3Z" />
  </Svg>
);

export const ForkIcon = (p) => (
  <Svg {...p}>
    <path d="M3 2v7c0 1.1.9 2 2 2h1v11h2V11h1a2 2 0 0 0 2-2V2h-2v5H7V2H5v5H4V2H3Z" />
    <path d="M19 2c-1.66 0-3 2.24-3 5 0 2.34 1.09 4.31 2.6 4.86L18 22h2l-.4-10.14C21.09 11.31 22 9.34 22 7c0-2.76-1.34-5-3-5Z" />
  </Svg>
);

export const BedIcon = (p) => (
  <Svg {...p}>
    <rect x="2" y="9" width="20" height="12" rx="2" />
    <path d="M2 14h20" />
    <path d="M2 9V6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5V9" />
    <path d="M7 9V7a1 1 0 0 1 2 0v2" />
  </Svg>
);

export const YoutubeIcon = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
    <path d="M10 9.5l5.5 2.5L10 14.5V9.5Z" fill="currentColor" stroke="none" />
  </Svg>
);

export const SpotifyIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8 10.5q4-1.5 8 .5" />
    <path d="M8 13q3-1.2 7 .5" />
    <path d="M8.5 15.5q2.5-.8 5.5.5" />
  </Svg>
);

export const InstagramIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="16.8" cy="7.2" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);
