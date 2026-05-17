// frontend/src/components/VideoBackground.jsx

import { useState } from "react";

const VIDEOS = [
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008693/hero-bg-1_s9fjwm.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008695/hero-bg-2_apqmbp.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008693/hero-bg-3_qwjvug.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008695/hero-bg-5_ii4mcw.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008694/hero-bg-6_ftjnqy.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008699/hero-bg-7_juctvt.mp4",
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
