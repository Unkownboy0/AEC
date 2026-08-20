import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstitution } from '../../context/InstitutionContext';

interface AecCinematicLoaderProps {
  onComplete?: () => void;
  isReady?: boolean;
}

// Reactive Native Theme detector (Detects .dark class on <html> & native prefers-color-scheme)
function useResolvedTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
      setTheme(isDarkClass || prefersDark ? 'dark' : 'light');
    };

    updateTheme();

    // Observe documentElement class changes (when user toggles dark/light mode in app settings)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) mq.addEventListener('change', updateTheme);

    return () => {
      observer.disconnect();
      if (mq) mq.removeEventListener('change', updateTheme);
    };
  }, []);

  return theme;
}

export const AecCinematicLoader: React.FC<AecCinematicLoaderProps> = ({
  onComplete,
  isReady = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'BUILDING' | 'LOCKED' | 'TRANSITIONING' | 'COMPLETE'>('BUILDING');
  const [showSecondaryTag, setShowSecondaryTag] = useState(false);
  const reqRef = useRef<number | null>(null);
  const theme = useResolvedTheme();
  const isDark = theme === 'dark';
  const { collegeName } = useInstitution();

  // The visual reveal animation always plays once (brand moment), but the loader
  // must not hand off to the app until the caller's `isReady` actually says so —
  // otherwise a slow bootstrap/auth check gets masked by a screen that has
  // already disappeared. animationDoneRef/isReadyRef let the two async signals
  // (rAF-driven animation, isReady prop) meet without restarting the animation.
  const animationDoneRef = useRef(false);
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  const proceedToLock = () => {
    setPhase((current) => (current === 'BUILDING' ? 'LOCKED' : current));
    setTimeout(() => {
      setPhase('TRANSITIONING');
      setTimeout(() => {
        setPhase('COMPLETE');
        if (onComplete) onComplete();
      }, 600);
    }, 500);
  };

  // 165Hz+ High Refresh Rate VSync Sync Loop via requestAnimationFrame
  useEffect(() => {
    let startTime: number | null = null;
    const DURATION = 2100; // Total loading animation duration (ms)

    const animateFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / DURATION, 1);

      // Smooth custom ease-in-out curve for sub-pixel liquid motion
      const easedProgress = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentPercent = easedProgress * 100;
      setProgress(currentPercent);

      if (currentPercent >= 48) {
        setShowSecondaryTag(true);
      }

      if (t < 1) {
        reqRef.current = requestAnimationFrame(animateFrame);
      } else {
        animationDoneRef.current = true;
        // Only lock in once the caller's data is actually ready; if not, the
        // isReady effect below fires proceedToLock() the moment it flips true.
        if (isReadyRef.current) proceedToLock();
      }
    };

    reqRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReady && animationDoneRef.current) {
      proceedToLock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  if (phase === 'COMPLETE') return null;

  const progressNormalized = progress / 100;

  // Exact 3D Extended Rounded Metallic Chrome typography paths for A, E, C matching user image
  const pathA = "M 30 140 L 78 24 Q 85 20 100 20 Q 115 20 122 24 L 170 140 L 136 140 L 126 112 L 74 112 L 64 140 Z M 81 92 L 119 92 L 100 48 Z";
  const pathE = "M 216 20 L 319 20 Q 335 20 335 36 L 335 46 L 236 46 Q 232 46 232 50 L 232 63 Q 232 67 236 67 L 315 67 L 315 93 L 236 93 Q 232 93 232 97 L 232 110 Q 232 114 236 114 L 335 114 L 335 124 Q 335 140 319 140 L 216 140 Q 200 140 200 124 L 200 36 Q 200 20 216 20 Z";
  const pathC = "M 510 46 L 435 46 C 406 46 398 60 398 80 C 398 100 406 114 435 114 L 510 114 L 510 124 Q 510 140 494 140 L 430 140 C 380 140 365 115 365 80 C 365 45 380 20 430 20 L 494 20 Q 510 20 510 36 Z";

  const fullPath = `${pathA} ${pathE} ${pathC}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'TRANSITIONING' ? 0 : 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden select-none px-6 py-12 pt-safe pb-safe transform-gpu will-change-transform transition-colors duration-300 ${
          isDark ? 'bg-[#07090E] text-white' : 'bg-[#F8FAFC] text-slate-900'
        }`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        {/* Background Ambient Radial Light (Theme Aware) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden transform-gpu">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: isDark ? [0.15, 0.28, 0.15] : [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transform-gpu ${
              isDark
                ? 'bg-radial from-[#8B5CF6]/25 via-[#1E1B4B]/10 to-transparent'
                : 'bg-radial from-[#6366F1]/18 via-[#E0E7FF]/30 to-transparent'
            }`}
          />
        </div>

        {/* Center Hero Component */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-2xl transform-gpu">
          {/* 3D Glass Metallic AEC Logo */}
          <div className="relative flex items-center justify-center mb-8 transform-gpu">
            <svg
              viewBox="0 0 540 160"
              className={`w-80 sm:w-[460px] md:w-[540px] h-auto overflow-visible filter transform-gpu ${
                isDark
                  ? 'drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)]'
                  : 'drop-shadow-[0_10px_20px_rgba(15,23,42,0.18)]'
              }`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* 3D Silver Chrome Vertical Gradient (Dark Mode) */}
                <linearGradient id="aec-metal-chrome-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="6%" stopColor="#E2E8F0" />
                  <stop offset="22%" stopColor="#CBD5E1" />
                  <stop offset="40%" stopColor="#94A3B8" />
                  <stop offset="65%" stopColor="#475569" />
                  <stop offset="85%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* 3D Titanium Metallic Vertical Gradient (Light Mode) */}
                <linearGradient id="aec-metal-chrome-light" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#64748B" stopOpacity="0.9" />
                  <stop offset="10%" stopColor="#334155" />
                  <stop offset="35%" stopColor="#1E293B" />
                  <stop offset="65%" stopColor="#0F172A" />
                  <stop offset="88%" stopColor="#020617" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* High Contrast Bevel Specular Rim Light */}
                <linearGradient id="aec-bevel-rim-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="30%" stopColor="#E2E8F0" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="aec-bevel-rim-light" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="30%" stopColor="#94A3B8" stopOpacity="0.8" />
                  <stop offset="65%" stopColor="#475569" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                </linearGradient>

                {/* Glossy Upper Glass Reflection */}
                <linearGradient id="aec-glass-gloss" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                  <stop offset="42%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>

                {/* Shimmer Light Sweep Effect */}
                <linearGradient id="aec-shine-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="40%" stopColor="transparent" />
                  <stop offset="50%" stopColor={isDark ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)"} />
                  <stop offset="60%" stopColor="transparent" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                {/* Sub-pixel precision Clip Path for 165Hz VSync Reveal */}
                <clipPath id="aec-fill-clip">
                  <rect x="0" y="0" width={540 * progressNormalized} height="160" />
                </clipPath>
              </defs>

              {/* ── FAINT SILHOUETTE OUTLINE (0% Base) ── */}
              <path
                d={fullPath}
                fillRule="evenodd"
                fill={isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(226, 232, 240, 0.65)"}
                stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(148, 163, 184, 0.45)"}
                strokeWidth="1.5"
              />

              {/* ── ILLUMINATED 3D METALLIC GLASS FILL (Sub-pixel Progress Masked) ── */}
              <g clipPath="url(#aec-fill-clip)">
                {/* Solid 3D Chrome Metallic Body */}
                <path
                  d={fullPath}
                  fillRule="evenodd"
                  fill={isDark ? "url(#aec-metal-chrome-dark)" : "url(#aec-metal-chrome-light)"}
                  stroke={isDark ? "url(#aec-bevel-rim-dark)" : "url(#aec-bevel-rim-light)"}
                  strokeWidth="2"
                />

                {/* Upper Glossy Sheen Glass Reflection */}
                <path
                  d={fullPath}
                  fillRule="evenodd"
                  fill="url(#aec-glass-gloss)"
                  className="pointer-events-none"
                />

                {/* Edge Specular Highlight stroke */}
                <path
                  d={fullPath}
                  fillRule="evenodd"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  strokeOpacity={isDark ? "0.6" : "0.8"}
                />
              </g>

              {/* ── LIGHT SWEEP SHIMMER AT 100% (GPU Accelerated) ── */}
              {phase === 'LOCKED' && (
                <motion.rect
                  x="-200"
                  y="0"
                  width="940"
                  height="160"
                  fill="url(#aec-shine-sweep)"
                  clipPath="url(#aec-fill-clip)"
                  initial={{ x: -400 }}
                  animate={{ x: 540 }}
                  transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </svg>
          </div>

          {/* Subtitle 1: AL-AMEEN ENGINEERING COLLEGE */}
          <motion.h1
            initial={{ opacity: 0.4, y: 5 }}
            animate={{
              opacity: phase === 'LOCKED' ? 1 : 0.4 + progressNormalized * 0.5,
              y: 0,
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-center px-4 transform-gpu ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {collegeName}
          </motion.h1>

          {/* Scene 5: 50% Secondary Motto Line */}
          <AnimatePresence>
            {showSecondaryTag && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`mt-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.3em] text-center flex items-center gap-2 transform-gpu ${
                  isDark ? 'text-violet-300/80' : 'text-indigo-600/90'
                }`}
              >
                <span>Engineering</span>
                <span className={isDark ? "text-violet-400" : "text-indigo-500"}>•</span>
                <span>Innovation</span>
                <span className={isDark ? "text-violet-400" : "text-indigo-500"}>•</span>
                <span>Excellence</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle Brand Watermark */}
        <div className="absolute bottom-6 text-[10px] text-slate-500/80 dark:text-slate-400/80 font-medium tracking-wider">
          CampusOS • Powered by Geetorus
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export { AecCinematicLoader as AecLoader };




