import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Calendar, Award, CreditCard, FileText,
  Users, Smartphone, Globe, Shield, Sparkles, CheckCircle2, ArrowRight,
  GraduationCap, UserCheck, Building2, Briefcase
} from 'lucide-react';
import { isNativePlatform, initAndroidBackButton } from '../../platform';
import { useInstitution } from '../../context/InstitutionContext';
import { InstitutionLogo } from './InstitutionLogo';

export const ONBOARDING_STORAGE_KEY = 'campusos_onboarding_completed';

export interface AppProductTourProps {
  isOpen: boolean;
  onComplete: () => void;
  isReplay?: boolean;
}

export const AppProductTour: React.FC<AppProductTourProps> = ({
  isOpen,
  onComplete,
  isReplay = false,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { collegeName, officialLogo } = useInstitution();

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Capacitor Android Back Button handling
  useEffect(() => {
    if (!isOpen) return;

    let removeBackHandler = () => {};
    if (isNativePlatform()) {
      removeBackHandler = initAndroidBackButton(
        () => {
          if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
          } else {
            handleComplete();
          }
        },
        () => true
      );
    }

    return () => removeBackHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSlide]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSlide]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onComplete();
  };

  // Touch Swipe Handlers (Min 50px delta)
  const minSwipeDistance = 50;

  const onTouchStartHandler = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMoveHandler = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < 3) {
      handleNext();
    } else if (isRightSwipe && currentSlide > 0) {
      handlePrev();
    }
  };

  // Motion variants with reduced motion fallback
  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : direction < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  const transitionDuration = prefersReducedMotion ? 0 : 0.35;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#07090E] text-white select-none overflow-hidden pt-safe pb-safe"
      onTouchStart={onTouchStartHandler}
      onTouchMove={onTouchMoveHandler}
      onTouchEnd={onTouchEndHandler}
    >
      {/* Background Ambient Connected-Campus Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      {/* Top Header Bar: Skip Button (Only on Slides 1-3) */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 h-16 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <InstitutionLogo variant="compact" size="xs" />
          <span className="font-extrabold text-sm tracking-tight text-white">CampusOS</span>
        </div>

        {currentSlide < 3 ? (
          <button
            type="button"
            onClick={handleComplete}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-slate-300 transition-all"
          >
            Skip
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Center Slide Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4 max-w-2xl sm:max-w-3xl mx-auto w-full">
        <AnimatePresence initial={false} mode="wait">
          {currentSlide === 0 && (
            <motion.div
              key="slide-0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-6 sm:space-y-8 w-full"
            >
              {/* Slide 1 Visual: Ecosystem Nodes */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-pulse" />
                <div className="absolute w-52 h-52 sm:w-56 sm:h-56 rounded-full border border-indigo-500/30" />
                
                {/* Central Hub Node */}
                <InstitutionLogo
                  variant="onboarding"
                  size="xl"
                  className="z-10 shadow-2xl shadow-violet-500/30 hover:scale-105 transition-transform"
                />

                {/* Orbiting Ecosystem Service Badges */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-violet-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  <span>Timetable</span>
                </div>
                <div className="absolute top-1/4 -right-4 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Results</span>
                </div>
                <div className="absolute bottom-1/4 -right-4 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fees</span>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Requests</span>
                </div>
                <div className="absolute bottom-1/4 -left-4 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Attendance</span>
                </div>
              </div>

              <div className="space-y-2.5 max-w-md">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">One Campus. One App.</h2>
                <p className="text-xs sm:text-base leading-relaxed text-slate-300 font-medium">
                  Your timetable, attendance, fees, results, requests and campus updates — all connected in one place.
                </p>
              </div>
            </motion.div>
          )}

          {currentSlide === 1 && (
            <motion.div
              key="slide-1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-5 sm:space-y-6 w-full"
            >
              {/* Slide 2 Visual: 2x2 Role Ecosystem Layout */}
              <div className="w-full max-w-sm sm:max-w-md space-y-3 sm:space-y-3.5">
                {/* Top Role Adaptation Cluster Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-[11px] font-semibold text-violet-300 backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Intelligent Role Adaptation</span>
                  </div>
                </div>

                {/* 2x2 Compact Glass Role Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {[
                    {
                      title: 'Student',
                      purpose: 'Learn & Manage',
                      description: 'Classes, attendance, fees & requests',
                      icon: GraduationCap,
                      accentBorder: 'border-blue-500/20 hover:border-blue-500/40',
                      topAccent: 'bg-blue-400',
                      iconBg: 'bg-blue-500/15 text-blue-400',
                      badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                    },
                    {
                      title: 'Faculty / Mentor',
                      purpose: 'Teach & Guide',
                      description: 'Classes, students, tasks & approvals',
                      icon: UserCheck,
                      accentBorder: 'border-purple-500/20 hover:border-purple-500/40',
                      topAccent: 'bg-purple-400',
                      iconBg: 'bg-purple-500/15 text-purple-400',
                      badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                    },
                    {
                      title: 'HOD / Dean',
                      purpose: 'Lead & Approve',
                      description: 'Departments, academics & decisions',
                      icon: Building2,
                      accentBorder: 'border-amber-500/20 hover:border-amber-500/40',
                      topAccent: 'bg-amber-400',
                      iconBg: 'bg-amber-500/15 text-amber-400',
                      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                    },
                    {
                      title: 'Campus Operations',
                      purpose: 'Manage & Support',
                      description: 'Finance, exams, services & facilities',
                      icon: Briefcase,
                      accentBorder: 'border-teal-500/20 hover:border-teal-500/40',
                      topAccent: 'bg-teal-400',
                      iconBg: 'bg-teal-500/15 text-teal-400',
                      badgeClass: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : i * 0.035, duration: 0.2 }}
                      className={`relative p-3 sm:p-3.5 rounded-[20px] bg-white/[0.04] dark:bg-slate-900/80 border ${item.accentBorder} backdrop-blur-md flex flex-col justify-between text-left shadow-xs transition-all`}
                    >
                      {/* Subtle Top-Edge Accent */}
                      <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-75 ${item.topAccent}`} />

                      <div className="space-y-2">
                        {/* Icon & Purpose Pill */}
                        <div className="flex items-center justify-between gap-1">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                            <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <span className={`text-[9px] sm:text-[9.5px] font-bold tracking-tight uppercase px-1.5 py-0.5 rounded-md border ${item.badgeClass}`}>
                            {item.purpose}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <span className="text-xs sm:text-sm font-bold block text-white tracking-tight">
                            {item.title}
                          </span>
                          <p className="text-[10px] sm:text-[11px] text-slate-300 font-normal leading-snug mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Title & Explanatory Subtext */}
              <div className="space-y-1.5 sm:space-y-2 max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  One Campus. Your Experience.
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  CampusOS adapts to your role and shows the tools, updates and actions that matter to you.
                </p>
              </div>
            </motion.div>
          )}

          {currentSlide === 2 && (
            <motion.div
              key="slide-2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-6 w-full"
            >
              {/* Slide 3 Visual: Phone & Web Sync */}
              <div className="relative w-64 h-56 flex items-center justify-center">
                {/* Mobile Phone Mockup */}
                <div className="w-32 h-48 rounded-2xl border-2 border-white/20 bg-slate-900/90 p-2 shadow-2xl flex flex-col justify-between transform -rotate-6">
                  <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
                  <div className="space-y-1.5 my-auto">
                    <div className="h-2 bg-violet-500/40 rounded w-3/4" />
                    <div className="h-2 bg-indigo-500/40 rounded w-full" />
                    <div className="h-2 bg-emerald-500/40 rounded w-1/2" />
                  </div>
                  <div className="flex justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                </div>

                {/* Cloud Sync Waves */}
                <div className="absolute z-10 w-12 h-12 rounded-full bg-violet-600/30 border border-violet-400/50 flex items-center justify-center shadow-lg animate-pulse">
                  <Globe className="w-6 h-6 text-white" />
                </div>

                {/* Web Laptop Mockup */}
                <div className="w-40 h-32 rounded-xl border-2 border-white/20 bg-slate-900/90 p-2 shadow-2xl flex flex-col justify-between transform rotate-6">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="space-y-1.5 my-auto">
                    <div className="h-2 bg-indigo-500/40 rounded w-full" />
                    <div className="h-2 bg-purple-500/40 rounded w-2/3" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">Sync Active</div>
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Everything Stays Connected.</h2>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  Attendance, leave, approvals, payments, certificates and academic updates stay synchronized across web and mobile.
                </p>
              </div>
            </motion.div>
          )}

          {currentSlide === 3 && (
            <motion.div
              key="slide-3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: transitionDuration, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center space-y-6 sm:space-y-8 w-full"
            >
              {/* Slide 4 Visual: Official Institution Branding */}
              <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center justify-center bg-gradient-to-tr from-violet-950/40 to-indigo-950/40 rounded-3xl border border-violet-500/30 p-6 sm:p-8 shadow-2xl space-y-4">
                <InstitutionLogo variant="onboarding" size="2xl" className="shadow-2xl hover:scale-105 transition-transform" />
                <div className="text-center space-y-1">
                  <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-white">
                    {collegeName || 'Al-Ameen Engineering College'}
                  </h3>
                  <p className="text-xs font-bold text-violet-300">
                    Institutional Academic & Campus Operating System
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>CampusOS Connected Experience</span>
                </div>
              </div>

              <div className="space-y-2.5 max-w-md">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Welcome to {collegeName || 'Al-Ameen Engineering College'}
                </h2>
                <p className="text-xs sm:text-base leading-relaxed text-slate-300 font-medium">
                  Your academics, attendance, timetable, fees, and campus services — all united in one connected institutional platform.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation & Action Bar */}
      <div className="relative z-10 px-6 py-6 space-y-4 max-w-2xl sm:max-w-3xl mx-auto w-full">
        {currentSlide < 3 ? (
          <div className="flex items-center justify-between">
            {/* Slide Progress Dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'w-8 bg-violet-500' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Slide 4 Final "Get Started" Button (No secondary button) */
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] text-white font-black text-base shadow-xl shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {/* Subtle Developer Attribution */}
        <p className="text-center text-[10px] text-slate-400 font-medium select-none pt-2">
          CampusOS • Developed by Geetorus
        </p>
      </div>
    </div>
  );
};

export default AppProductTour;
