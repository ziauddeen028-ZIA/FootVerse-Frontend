import React, { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'footverseIntroSeen';

export const FirstVisitIntro = () => {
  const [shouldRender, setShouldRender] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);
  const isFinishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('FootVerse: Unable to write intro state to localStorage:', error);
    }

    setIsFadingOut(true);
    setTimeout(() => {
      setShouldRender(false);
    }, 700);
  }, []);

  // Lock scrolling while the intro is active
  useEffect(() => {
    if (!shouldRender) return;

    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, [shouldRender]);

  // Attempt auto-play when intro is visible
  useEffect(() => {
    if (!shouldRender || !videoRef.current) return;

    const video = videoRef.current;
    video.muted = true;

    // Trigger source evaluation for responsive media queries
    if (typeof video.load === 'function') {
      video.load();
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('FootVerse: Autoplay prevented or failed to start:', err);
        // If autoplay fails completely or is blocked, finish smoothly
        handleFinish();
      });
    }

    // Safety timeout: if video doesn't end or gets stuck after 30 seconds, auto-dismiss
    const fallbackTimer = setTimeout(() => {
      if (!isFinishedRef.current) {
        handleFinish();
      }
    }, 30000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [shouldRender, handleFinish]);

  // Allow keyboard Escape / Space to skip
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        handleFinish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shouldRender, handleFinish]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 w-screen h-[100dvh] z-[999999] bg-black flex items-center justify-center overflow-hidden transition-all duration-700 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      aria-label="FootVerse Intro Video"
      role="dialog"
      aria-modal="true"
    >
      {/* Background backdrop */}
      <div className="absolute inset-0 bg-black" />

      {/* Responsive Video Player */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleFinish}
        className="relative z-0 w-full h-full object-cover md:object-contain bg-black max-w-full max-h-full"
      >
        {/* Mobile video: matches phone portrait (<= 767px) and phone landscape (<= 500px height) */}
        <source
          src="/Video Project mobile.mp4"
          media="(max-width: 767px), (max-height: 500px) and (orientation: landscape)"
          type="video/mp4"
        />
        {/* Desktop and tablet video */}
        <source
          src="/Video Project (1).mp4"
          media="(min-width: 768px)"
          type="video/mp4"
        />
        {/* Default fallback */}
        <source
          src="/Video Project (1).mp4"
          type="video/mp4"
        />
      </video>

      {/* Skip Button - Responsive & Accessible */}
      <button
        type="button"
        onClick={handleFinish}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md text-xs sm:text-sm font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xl hover:scale-105 active:scale-95"
        aria-label="Skip Intro"
      >
        <span>Skip Intro</span>
        <span aria-hidden="true" className="text-white/60">✕</span>
      </button>
    </div>
  );
};
