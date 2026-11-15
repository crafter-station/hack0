"use client";

import { useEffect, useRef } from "react";

/**
 * A gallery video. Silent clips loop while on screen; with reduced motion, or for a video with sound,
 * the poster stays and the visitor starts it from the controls.
 */
export function Clip({ src, poster, label, sound = false }: { src: string; poster: string; label: string; sound?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || sound) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return video.pause();
        // Autoplay can be refused (data saver, low power); the poster stays and the tile still reads.
        video.play().catch(() => {
          video.controls = true;
        });
      },
      { threshold: 0.35 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [sound]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      preload="none"
      playsInline
      muted={!sound}
      loop={!sound}
      controls={sound}
    />
  );
}
