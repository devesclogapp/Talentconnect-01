import React, { useState } from 'react';
import {
  Zap,
  ArrowRight,
  Shield,
  TrendingUp,
  Globe,
  Play,
  Sparkles,
  Network,
  Lock
} from 'lucide-react';

interface Props {
  onNavigate: (v: string) => void;
}

const Onboarding: React.FC<Props> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState(0);

  const steps = [
    {
      title: "Elite Marketplace\nNetwork",
      desc: "Connect with the world's top-tier service professionals through our verified talent ecosystem.",
      icon: <Network size={48} className="text-accent-primary" />
    },
    {
      title: "Secure Contract\nExecution",
      desc: "Every transaction is protected by our financial-grade escrow system and real-time verification protocols.",
      icon: <Lock size={48} className="text-accent-primary" />
    },
    {
      title: "Performance\nTracking",
      desc: "Monitor service quality, provider ratings, and portfolio analytics with institutional-grade precision.",
      icon: <TrendingUp size={48} className="text-accent-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col relative overflow-hidden">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-full h-full bg-accent-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[80%] h-[80%] bg-blue-500/5 rounded-full blur-[150px]"></div>

        {/* Precision Grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#C6FF00_1px,transparent_1px),linear-gradient(to_bottom,#C6FF00_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent-primary rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent-primary rounded-full opacity-30 animate-pulse delay-100"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-accent-primary rounded-full opacity-25 animate-pulse delay-200"></div>
      </div>

      <div className="flex-1 flex flex-col pt-20 px-8 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-2xl bg-bg-secondary border border-border-medium flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-accent-primary" />
          </div>
          <div>
            <p className="meta !text-[8px] !lowercase text-text-tertiary leading-none">marketplace protocol</p>
            <h2 className="heading-md tracking-tight">Talent Connect</h2>
          </div>
        </div>

        {/* Content Carousel */}
        <div className="space-y-6 mb-20 flex-1">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-medium flex items-center justify-center mb-12 shadow-2xl animate-bounce-slow">
            {steps[activeTab].icon}
          </div>

          <h1 className="heading-4xl tracking-tighter whitespace-pre-line animate-fade-in leading-[1.05]">
            {steps[activeTab].title}
          </h1>

          <p className="body !text-base max-w-[300px] animate-fade-in !leading-relaxed" key={activeTab}>
            {steps[activeTab].desc}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-14">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${activeTab === i
                ? 'w-12 bg-accent-primary shadow-glow'
                : 'w-5 bg-bg-tertiary'
                }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => onNavigate('login')}
            className="btn-primary w-full justify-between group !h-[60px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-bg-primary/20 flex items-center justify-center">
                <Play size={16} fill="currentColor" />
              </div>
              <span className="uppercase tracking-[0.25em] font-black text-[12px]">Access Market</span>
            </div>
            <ArrowRight size={22} className="transition-transform group" />
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="w-full h-[56px] rounded-2xl bg-bg-secondary border border-border-medium flex items-center justify-center gap-2 text-text-secondary   transition-all group"
          >
            <span className="text-xs font-black uppercase tracking-[0.3em]">Register as Provider</span>
            <ArrowRight size={16} className="opacity-0 group transition-opacity" />
          </button>
        </div>

        {/* Footer */}
        <div className="pt-6 pb-10 text-center border-t border-border-subtle/30">
          <p className="meta !text-[8px] opacity-40">Talent Connect v3.0 • Secured Infrastructure</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;