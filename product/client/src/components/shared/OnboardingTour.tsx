import React, { useState } from 'react';
import {
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck,
  BookOpen, Award, Compass, X
} from 'lucide-react';

interface OnboardingTourProps {
  userRole: string;
  userName: string;
  onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userRole, userName, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: `Welcome to Geetorus CampusOS, ${userName}`,
      subtitle: `Enterprise Campus Operating System · Designed for ${userRole}`,
      icon: Sparkles,
      content: 'Experience a modern, high-performance campus operating system inspired by Microsoft Dynamics 365, Salesforce Education Cloud, and Workday Student.',
      badge: 'CampusOS v4.0'
    },
    {
      title: 'Role-Dedicated Workspaces',
      subtitle: 'Tailored specifically for your operational domain',
      icon: Compass,
      content: 'Every role operates inside a specialized, independent dashboard with custom analytics, quick action command bars, and department health metrics.',
      badge: 'Zero Clutter'
    },
    {
      title: 'Real-Time Workflows & Escalations',
      subtitle: 'Seamless cross-departmental collaboration',
      icon: ShieldCheck,
      content: 'Multi-level approval queues connect Students, Faculty, HODs, Deans, and Executive Leadership in synchronized real-time workflows.',
      badge: 'AI-Powered'
    },
    {
      title: 'Ready to Transform Your Campus',
      subtitle: 'Let us launch your workspace',
      icon: Award,
      content: 'You are all set! Access your personalized widgets, quick actions, and automated insights right now.',
      badge: 'Complete'
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-primary/20 overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-primary p-6 text-white relative overflow-hidden">
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Skip Tour"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-extrabold tracking-wide uppercase border border-white/20 mb-3">
            <Sparkles className="h-3 w-3" />
            {currentStep.badge}
          </div>

          <h2 className="text-xl font-black tracking-tight">{currentStep.title}</h2>
          <p className="text-xs text-indigo-100 font-medium mt-1">{currentStep.subtitle}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="flex gap-4 items-start">
            <div className="p-3.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <currentStep.icon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                {currentStep.content}
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === step ? 'w-6 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onComplete}
                className="px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip Tour
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all active:scale-95"
              >
                {step === steps.length - 1 ? (
                  <>
                    Finish Tour <CheckCircle2 className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
