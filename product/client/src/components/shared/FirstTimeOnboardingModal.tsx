import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ClipboardCheck, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const FirstTimeOnboardingModal: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!user) return;
    const hasSeenOnboarding = localStorage.getItem(`has_seen_onboarding_${user.id}`);
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleFinish = () => {
    localStorage.setItem(`has_seen_onboarding_${user.id}`, 'true');
    setIsOpen(false);
  };

  const slides = [
    {
      title: `Welcome to CampusOS, ${user.firstName || 'Friend'}! 👋`,
      subtitle: 'Your personal digital campus hub',
      description: 'CampusOS is designed to make your daily academic life smooth, transparent, and effortlessly simple.',
      icon: <Sparkles className="w-10 h-10 text-primary" />,
      colorBg: 'bg-primary/10 border-primary/20',
    },
    {
      title: 'See Today’s Schedule & Priorities',
      subtitle: 'Everything you need on your Home Screen',
      description: 'Check your upcoming classes, current period reminders, attendance percentage, and pending assignments at a glance.',
      icon: <Calendar className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />,
      colorBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'One-Tap Requests & Clear Approvals',
      subtitle: 'Google Maps-style step-by-step tracking',
      description: 'Apply for Leave or On-Duty in simple steps. Watch your application progress live through mentor, HOD, and principal approvals.',
      icon: <ClipboardCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
      colorBg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  const current = slides[slide];
  const isLast = slide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs animate-in fade-in" onClick={handleFinish} />

      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl shadow-modal overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-[10px] font-black uppercase text-primary tracking-wider">First-Time Guided Tour</span>
          <button onClick={handleFinish} className="p-1.5 text-text-muted hover:text-text-primary rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Card Content */}
        <div className="text-center space-y-4 py-3">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border shadow-xs ${current.colorBg}`}>
            {current.icon}
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">{current.title}</h3>
            <p className="text-xs font-semibold text-primary mt-0.5">{current.subtitle}</p>
            <p className="text-xs text-text-muted mt-2 leading-relaxed px-2">{current.description}</p>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        <div className="flex justify-center items-center gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === slide ? 'w-6 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={handleFinish}
            className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2"
          >
            Skip Tour
          </button>

          <button
            onClick={() => {
              if (isLast) handleFinish();
              else setSlide((s) => s + 1);
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary-hover shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>{isLast ? 'Get Started' : 'Next'}</span>
            {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
