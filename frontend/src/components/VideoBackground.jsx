// frontend/src/components/VideoBackground.jsx

import { useState, useEffect, useRef } from "react";

const VIDEOS = [
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008693/hero-bg-1_s9fjwm.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008695/hero-bg-2_apqmbp.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008693/hero-bg-3_qwjvug.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008695/hero-bg-5_ii4mcw.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008694/hero-bg-6_ftjnqy.mp4",
  "https://res.cloudinary.com/disymrucq/video/upload/v1779008699/hero-bg-7_juctvt.mp4",
];

const CLIP_DURATION = 15000;

function randomNext(current) {
  if (VIDEOS.length === 1) return 0;
  let next;
  do { next = Math.floor(Math.random() * VIDEOS.length); } while (next === current);
  return next;
}

export default function VideoBackground() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * VIDEOS.length));
  const timerRef = useRef(null);

  function advance() {
    setIdx((i) => randomNext(i));
  }

  useEffect(() => {
    timerRef.current = setTimeout(advance, CLIP_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [idx]);

  return (
    <div className="video-bg" aria-hidden="true">
      <video
        key={idx}
        className="video-bg__video"
        ref={(el) => { if (el) { el.muted = true; el.play().catch(() => {}); } }}
        autoPlay
        playsInline
        preload="auto"
      >
        <source src={VIDEOS[idx]} type="video/mp4" />
      </video>
    </div>
  );
}
