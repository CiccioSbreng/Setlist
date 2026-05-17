// frontend/src/components/VideoBackground.jsx

import { useState } from "react";

const VIDEOS = [
  "/hero-bg-1.mp4",
  "/hero-bg-2.mp4",
  "/hero-bg-3.mp4",
];

export default function VideoBackground() {
  const [idx, setIdx] = useState(0);

  return (
    <div className="video-bg" aria-hidden="true">
      <video
        key={idx}
        className="video-bg__video"
        ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}); } }}
        autoPlay
        playsInline
        preload="auto"
        onEnded={() => setIdx((i) => (i + 1) % VIDEOS.length)}
      >
        <source src={VIDEOS[idx]} type="video/mp4" />
      </video>
    </div>
  );
}
