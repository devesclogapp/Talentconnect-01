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
import onboardingBg from '../assets/onboarding_bg.png';

interface Props {
  onNavigate: (v: string) => void;
}

const Onboarding: React.FC<Props> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState(0);

  const steps = [
    {
      title: "Conecte-se com a Elite",
      desc: "Acesse os melhores profissionais do mercado através do nosso ecossistema verificado.",
      icon: <Network size={48} className="text-white" />
    },
    {
      title: "Contratos Seguros",
      desc: "Transações protegidas por sistema de custódia financeira e verificação em tempo real.",
      icon: <Lock size={48} className="text-white" />
    },
    {
      title: "Monitoramento de Performance",
      desc: "Acompanhe a qualidade, avaliações e análises com precisão institucional.",
      icon: <TrendingUp size={48} className="text-white" />
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={onboardingBg}
          alt="Professional Worker"
          className="w-full h-full object-cover object-center scale-125 transition-transform duration-700"
          style={{ transform: 'translateY(-50px) scale(1.25)' }}
        />
        {/* Dark Gradient Overlay - Clearer top for face visibility, Darker bottom for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      </div>

      <div className="flex-1 flex flex-col pt-16 px-6 relative z-10">
        {/* Brand Header - Top Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="meta !text-[8px] text-white/80 leading-none font-normal">Protocolo de mercado</p>
            <h2 className="heading-md text-white">Talent Connect</h2>
          </div>
        </div>

        {/* Spacer to push content down */}
        <div className="flex-1"></div>

        {/* Bottom Content Area */}
        <div className="flex flex-col gap-8 pb-10">

          {/* Content Carousel */}
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-2xl animate-bounce-slow">
              {React.cloneElement(steps[activeTab].icon as React.ReactElement, { size: 32 })}
            </div>

            <h1 className="heading-3xl whitespace-pre-line animate-fade-in leading-tight text-white">
              {steps[activeTab].title}
            </h1>

            <p className="body !text-sm max-w-[320px] animate-fade-in !leading-relaxed text-white/80" key={activeTab}>
              {steps[activeTab].desc}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${activeTab === i
                  ? 'w-12 bg-white shadow-glow'
                  : 'w-5 bg-white/20'
                  }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => onNavigate('LOGIN')}
              className="w-full h-[56px] px-6 rounded-xl font-bold flex items-center justify-between gap-2 transition-all duration-200 active:scale-95 bg-white text-black hover:bg-white/90 group shadow-lg shadow-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                  <Play size={14} fill="currentColor" />
                </div>
                <span className="font-medium text-sm">Entrar na minha conta</span>
              </div>
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onNavigate('REGISTER')}
              className="w-full h-[56px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center gap-2 text-white transition-all group hover:bg-white/10"
            >
              <span className="text-sm font-medium">Criar nova conta</span>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Minimal Footer */}
          <div className="text-center pt-2">
            <p className="meta !text-[10px] opacity-40 font-normal text-white">Talent Connect v3.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;