
import React, { useState } from 'react';

interface Props {
  negotiation: any;
  onBack: () => void;
  onComplete: () => void;
}

const NegotiationFlow: React.FC<Props> = ({ negotiation, onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [counterPrice, setCounterPrice] = useState(negotiation?.price || 'R$ 450');
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const steps = [
    { id: 1, title: 'Proposta Recebida', desc: 'Cliente solicitou orçamento', icon: 'mail' },
    { id: 2, title: 'Ajuste de Proposta', desc: 'Sua contraproposta em análise', icon: 'payments' },
    { id: 3, title: 'Confirmação Final', desc: 'Aguardando aceite do cliente', icon: 'hourglass_empty' },
    { id: 4, title: 'Serviço Agendado', desc: 'Acordo selado e confirmado', icon: 'verified' }
  ];

  const simulateProgress = (nextStep: number) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(nextStep);
      setShowCounterInput(false);
    }, 1000);
  };

  const handleAction = (type: 'ACCEPT' | 'COUNTER' | 'SEND_COUNTER' | 'CANCEL' | 'FINISH' | 'OPEN_DISPUTE' | 'CONFIRM_DISPUTE') => {
    switch (type) {
      case 'ACCEPT':
        simulateProgress(4);
        break;
      case 'COUNTER':
        setShowCounterInput(true);
        break;
      case 'SEND_COUNTER':
        simulateProgress(2);
        setTimeout(() => simulateProgress(3), 3000);
        break;
      case 'CANCEL':
        onBack();
        break;
      case 'FINISH':
        onComplete();
        break;
      case 'OPEN_DISPUTE':
        setShowDisputeModal(true);
        break;
      case 'CONFIRM_DISPUTE':
        setShowDisputeModal(false);
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setIsDisputed(true);
        }, 1500);
        break;
    }
  };

  return (
    <div className="bg-app-bg min-h-screen transition-colors">
      <header className="sticky top-0 z-50 bg-card-bg border-b border-gray-100 dark:border-gray-800 px-2 py-4 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-app-text">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h1 className="heading-md uppercase tracking-widest">Negociação</h1>
        <div className="w-10"></div>
      </header>

      {isDisputed && (
        <div className="bg-red-500 text-white p-3 flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined">gavel</span>
          <p className="meta-bold uppercase tracking-widest">Negociação sob disputa - Suporte em mediação</p>
        </div>
      )}

      <main className="p-4 space-y-6 pb-44">
        {/* Card do Cliente */}
        <div className={`bg-card-bg border ${isDisputed ? 'border-red-500' : 'border-gray-100 dark:border-zinc-800'} p-5 rounded-2xl flex items-center gap-4 transition-colors`}>
          <div className={`w-14 h-14 ${isDisputed ? 'bg-red-100 text-red-600' : 'bg-brand-primary/10 text-brand-primary'} rounded-full flex items-center justify-center text-xl font-black`}>
            {negotiation?.client?.[0] || 'L'}
          </div>
          <div className="flex-1">
            <h2 className="heading-lg text-app-text">{negotiation?.client || 'Luiza M.'}</h2>
            <p className="meta-bold text-app-text-muted uppercase tracking-tighter">Pedido: {negotiation?.service || 'Limpeza Pós-Obra'}</p>
          </div>
          <div className="text-right">
            <span className={`meta-bold ${isDisputed ? 'text-red-500 bg-red-100' : 'text-black bg-primary/10'} px-2 py-1 rounded uppercase tracking-widest !text-[9px]`}>
              {isDisputed ? 'Disputa' : 'Ativo'}
            </span>
          </div>
        </div>

        {/* Stepper Vertical */}
        {!isDisputed && (
          <div className="bg-card-bg border border-gray-100 dark:border-zinc-800 p-6 rounded-3xl space-y-0 relative shadow-sm">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-700 ${currentStep >= step.id
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                    : 'bg-gray-100 dark:bg-zinc-800 text-app-text-muted opacity-40'
                    }`}>
                    <span className={`material-symbols-outlined text-[18px] ${currentStep >= step.id ? 'fill-1' : ''}`}>
                      {step.icon}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-12 transition-all duration-700 ${currentStep > step.id ? 'bg-brand-primary' : 'bg-gray-100 dark:border-zinc-800'
                      }`}></div>
                  )}
                </div>
                <div className={`pt-1 transition-all duration-700 ${currentStep >= step.id ? 'opacity-100' : 'opacity-30'}`}>
                  <h3 className="body-bold text-app-text leading-none">{step.title}</h3>
                  <p className="meta text-app-text-muted mt-1 uppercase tracking-tight">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem de Disputa */}
        {isDisputed && (
          <div className="bg-white dark:bg-zinc-900 border border-red-100 p-6 rounded-3xl space-y-4">
            <h3 className="body-bold text-red-600 uppercase">O que acontece agora?</h3>
            <p className="meta text-app-text-muted leading-relaxed font-medium">
              Nossa equipe de suporte recebeu os detalhes do desacordo. Analisaremos as mensagens e propostas enviadas. Em até 2 horas, entraremos em contato via chat interno ou telefone.
            </p>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-500">
              <span className="material-symbols-outlined">support_agent</span>
              <span className="meta-bold uppercase">Ticket #DISP-9921 aberto</span>
            </div>
          </div>
        )}

        {/* Resumo Financeiro / Contraproposta Input */}
        <div className={`transition-all duration-300 transform ${showCounterInput ? 'scale-100' : 'scale-100'}`}>
          {showCounterInput ? (
            <div className="bg-white dark:bg-zinc-900 border-2 border-brand-primary p-6 rounded-3xl shadow-xl">
              <p className="meta-bold text-brand-primary uppercase tracking-widest mb-4">Nova Proposta de Valor</p>
              <div className="flex items-center gap-3">
                <span className="heading-xl text-app-text !text-2xl">R$</span>
                <input
                  type="text"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="bg-transparent border-none heading-xl p-0 focus:ring-0 text-app-text w-full !text-4xl"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-3xl flex justify-between items-center transition-colors ${currentStep === 4 ? 'bg-feedback-success/5 dark:bg-feedback-success/10 border border-feedback-success/10' : isDisputed ? 'bg-red-50 dark:bg-red-900/10 border border-red-100' : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-100'}`}>
              <div>
                <p className="meta-bold text-app-text-muted uppercase tracking-widest opacity-60">
                  {isDisputed ? 'Valor em Disputa' : 'Valor Acordado'}
                </p>
                <p className="heading-xl text-app-text mt-1 !text-3xl">{counterPrice}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center">
                <span className={`material-symbols-outlined ${currentStep === 4 ? 'text-feedback-success' : isDisputed ? 'text-red-600' : 'text-orange-600'} font-black`}>
                  {currentStep === 4 ? 'check_circle' : isDisputed ? 'gavel' : 'payments'}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER CTAs */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-50">
        {!isDisputed ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              {currentStep === 1 && !showCounterInput && (
                <>
                  <button
                    onClick={() => handleAction('COUNTER')}
                    className="flex-1 py-4 border-2 border-gray-100 dark:border-zinc-700 text-app-text label-semibold uppercase rounded-2xl active:bg-gray-50 transition-all"
                  >
                    Contraproposta
                  </button>
                  <button
                    onClick={() => handleAction('ACCEPT')}
                    disabled={loading}
                    className="flex-[2] py-4 bg-brand-primary text-white label-semibold uppercase rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Aceitar Orçamento'}
                  </button>
                </>
              )}

              {showCounterInput && (
                <>
                  <button
                    onClick={() => setShowCounterInput(false)}
                    className="flex-1 py-4 text-app-text-muted label-semibold uppercase active:scale-95"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => handleAction('SEND_COUNTER')}
                    disabled={loading}
                    className="flex-[3] py-4 bg-brand-primary text-white label-semibold uppercase rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enviar Nova Proposta'}
                  </button>
                </>
              )}

              {currentStep === 2 && (
                <button disabled className="w-full py-4 bg-gray-100 dark:bg-zinc-800 text-app-text-muted label-semibold uppercase rounded-2xl flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Proposta em análise...
                </button>
              )}

              {currentStep === 3 && (
                <button onClick={() => handleAction('ACCEPT')} className="w-full py-4 bg-brand-primary text-white label-semibold uppercase rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-95 transition-all">
                  Simular Aprovação do Cliente
                </button>
              )}

              {currentStep === 4 && (
                <button onClick={() => handleAction('FINISH')} className="w-full py-4 bg-brand-primary text-white label-semibold uppercase rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">event_available</span>
                  Ver Agenda
                </button>
              )}
            </div>

            {!showCounterInput && currentStep < 4 && (
              <button
                onClick={() => handleAction('OPEN_DISPUTE')}
                className="w-full text-center text-red-500 meta-bold uppercase tracking-widest pt-2"
              >
                Abrir Disputa / Desacordo
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onBack}
            className="w-full py-4 border-2 border-gray-100 dark:border-zinc-700 text-app-text label-semibold uppercase rounded-2xl"
          >
            Voltar ao Dashboard
          </button>
        )}
      </footer>

      {/* DISPUTE MODAL / SHEET */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDisputeModal(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-t-[32px] p-8 space-y-6 animate-[slide-up_0.3s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h2 className="heading-xl text-app-text uppercase tracking-tight">Motivo da Disputa</h2>
              <p className="meta-bold text-app-text-muted mt-2">Selecione o problema que você está enfrentando</p>
            </div>

            <div className="space-y-3">
              {['Valor incorreto', 'Cliente não responde', 'Local de difícil acesso', 'Outro motivo'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleAction('CONFIRM_DISPUTE')}
                  className="w-full p-4 text-left border border-gray-100 dark:border-zinc-800 rounded-2xl body-bold text-app-text active:bg-red-50 active:border-red-200 transition-all"
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDisputeModal(false)}
              className="w-full py-4 text-app-text-muted label-semibold uppercase"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default NegotiationFlow;
