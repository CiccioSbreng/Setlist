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

function pick(excludeIdx) {
  let n;
  do { n = Math.floor(Math.random() * VIDEOS.length); } while (n === excludeIdx);
  return n;
}

export default function VideoBackground() {
  const ref0 = useRef(null);
  const ref1 = useRef(null);

  const [front, setFront] = useState(0);
  const [idx0] = useState(() => Math.floor(Math.random() * VIDEOS.length));
  const [idx1] = useState(() => pick(Math.floor(Math.random() * VIDEOS.length)));
  const backIdxRef = useRef(idx1);

  function playEl(el) {
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }

  useEffect(() => {
    playEl(ref0.current);
    playEl(ref1.current);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFront((f) => {
        const next = f === 0 ? 1 : 0;
        const backRef = f === 0 ? ref0 : ref1;
        const currentFrontIdx = f === 0 ? idx0 : idx1;
        const newIdx = pick(currentFrontIdx);
        backIdxRef.current = newIdx;
        const el = backRef.current;
        if (el) {
          el.src = VIDEOS[newIdx];
          el.load();
          el.currentTime = 0;
          playEl(el);
        }
        return next;
      });
    }, CLIP_DURATION);
    return () => clearTimeout(t);
  }, [front, idx0, idx1]);

  return (
    <div className="video-bg" aria-hidden="true">
      <video
        ref={ref0}
        className={`video-bg__video${front === 0 ? " is-active" : ""}`}
        src={VIDEOS[idx0]}
        muted
        playsInline
        loop
        preload="auto"
      />
      <video
        ref={ref1}
        className={`video-bg__video${front === 1 ? " is-active" : ""}`}
        src={VIDEOS[idx1]}
        muted
        playsInline
        loop
        preload="auto"
      />
    </div>
  );
}
