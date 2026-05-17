// frontend/src/components/StageBackground.jsx
// Sfondo stile palco da concerto: coni di luce animati, nebbia, silhouette folla.
// Puro CSS/SVG, zero JS, zero dipendenze esterne.

export default function StageBackground() {
  return (
    <div className="stage-bg" aria-hidden="true">
      {/* 4 coni di luce che oscillano dal top come fari da palco */}
      <div className="stage-bg__cone stage-bg__cone--1" />
      <div className="stage-bg__cone stage-bg__cone--2" />
      <div className="stage-bg__cone stage-bg__cone--3" />
      <div className="stage-bg__cone stage-bg__cone--4" />

      {/* Nebbia / haze colorata ai piedi del palco */}
      <div className="stage-bg__haze" />

      {/* Silhouette folla con braccia alzate */}
      <svg
        className="stage-bg__crowd"
        viewBox="0 0 1440 170"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#08080c"
          d="M0,170 L0,132 C18,124 32,108 48,120 C64,132 78,110 96,118
             C114,126 126,98 145,106 C164,114 174,86 195,92 C216,98 224,68
             245,74 C266,80 275,52 298,58 C321,64 328,36 353,42 C378,48
             385,20 412,26 C439,32 444,8 472,14 C500,20 504,0 534,5
             C564,10 566,28 598,22 C630,16 630,34 664,28 C698,22 698,38
             732,34 C766,30 766,44 800,42 C834,40 836,52 870,52 C904,52
             906,62 940,62 C974,62 978,70 1012,72 C1046,74 1048,80 1082,82
             C1116,84 1120,88 1154,90 C1188,92 1194,94 1228,96 C1262,98
             1268,100 1302,102 C1336,104 1344,106 1378,108 L1440,112
             L1440,170 Z"
        />
      </svg>
    </div>
  );
}
