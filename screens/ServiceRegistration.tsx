import React, { useState, useEffect } from 'react';
import { createService, updateService, getServiceById } from '../services/servicesService';
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Hammer,
  Zap,
  Droplets,
  Briefcase,
  Truck,
  Dog,
  HeartPulse,
  Sparkles,
  DollarSign,
  Clock
} from 'lucide-react';
import { useAppStore } from '../store';

interface Props {
  onBack: () => void;
  onComplete: () => void;
  serviceId?: string; // ID do serviço para edição
}

const CATEGORIES = [
  { id: 'Limpeza', label: 'Limpeza', icon: <Sparkles size={18} /> },
  { id: 'Reparos', label: 'Reparos', icon: <Hammer size={18} /> },
  { id: 'Elétrica', label: 'Elétrica', icon: <Zap size={18} /> },
  { id: 'Hidráulica', label: 'Hidráulica', icon: <Droplets size={18} /> },
  { id: 'Beleza', label: 'Beleza', icon: <HeartPulse size={18} /> }, // Using HeartPulse as placeholder for Beauty
  { id: 'Saúde', label: 'Saúde', icon: <HeartPulse size={18} /> },
  { id: 'Pet', label: 'Pet', icon: <Dog size={18} /> },
  { id: 'Mudança', label: 'Mudança', icon: <Truck size={18} /> },
  { id: 'Consultoria', label: 'Consultoria', icon: <Briefcase size={18} /> },
];

const ServiceRegistration: React.FC<Props> = ({ onBack, onComplete, serviceId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(!!serviceId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Limpeza',
    basePrice: '50',
    description: '',
    durationHours: '1',
    pricingMode: 'fixed' as 'fixed' | 'hourly'
  });

  // Carregar dados do serviço se estiver em modo de edição
  useEffect(() => {
    const loadService = async () => {
      if (!serviceId) {
        setLoadingService(false);
        return;
      }

      try {
        setLoadingService(true);
        const service = await getServiceById(serviceId);

        if (!service) {
          throw new Error('Serviço não encontrado');
        }

        setFormData({
          title: service.title || '',
          category: service.category || 'Limpeza',
          basePrice: String(service.base_price || 50),
          description: service.description || '',
          durationHours: String(service.duration_hours || 0),
          pricingMode: service.pricing_mode || 'fixed'
        });
      } catch (error) {
        console.error("Erro ao carregar serviço:", error);
        alert("Erro ao carregar dados do serviço.");
        onBack();
      } finally {
        setLoadingService(false);
      }
    };

    loadService();
  }, [serviceId, onBack]);

  const handleFinish = async () => {
    if (!formData.title || !formData.basePrice) {
      alert("Por favor, preencha o título e o preço.");
      return;
    }

    setLoading(true);
    try {
      const servicePayload = {
        title: formData.title,
        category: formData.category,
        base_price: parseFloat(formData.basePrice),
        description: formData.description,
        pricing_mode: formData.pricingMode,
        duration_hours: parseFloat(formData.durationHours) || 0,
        active: true
      };

      if (serviceId) {
        await updateService(serviceId, servicePayload);
      } else {
        await createService(servicePayload);
      }

      onComplete();

    } catch (error: any) {
      alert(error.message || "Erro ao salvar. Verifique se você está logado corretamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0];

  return (
    <div className="bg-app-bg min-h-screen transition-colors font-sans">
      {/* Header Compacto */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[10px] font-black tracking-[0.2em] text-text-tertiary mb-1">
            {serviceId ? 'Editar Operação' : 'Nova Operação'}
          </h1>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-8 h-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-accent-primary' : 'bg-border-subtle'}`}
              />
            ))}
          </div>
        </div>
        <div className="w-10"></div> {/* Spacer balance */}
      </header>

      {loadingService ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin"></div>
            <p className="text-[10px] tracking-widest text-text-tertiary animate-pulse">Carregando dados...</p>
          </div>
        </div>
      ) : (

        <main className="p-6 pb-32 max-w-lg mx-auto">
          {step === 1 && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center space-y-2">
                <h2 className="heading-xl tracking-tight text-text-primary text-[28px]">Defina sua Oferta</h2>
                <p className="text-sm text-text-tertiary">Crie um título atrativo para seu serviço.</p>
              </div>

              <div className="space-y-6">
                {/* Title Input */}
                <div className="group">
                  <label className="block text-[10px] font-black tracking-widest text-text-tertiary mb-2 ml-1">Título do Serviço</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Consultoria Premium, Reparo Rápido..."
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="w-full bg-bg-secondary border border-border-subtle rounded-2xl p-5 text-lg font-medium text-text-primary placeholder:text-text-tertiary/50 outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                      <Sparkles size={18} className="text-accent-primary" />
                    </div>
                  </div>
                </div>

                {/* Custom Category Dropdown */}
                <div className="relative z-20">
                  <label className="block text-[10px] font-black tracking-widest text-text-tertiary mb-2 ml-1">Categoria Principal</label>

                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full bg-bg-secondary border border-border-subtle rounded-2xl p-4 flex items-center justify-between transition-all active:scale-[0.99] ${dropdownOpen ? 'ring-4 ring-accent-primary/10 border-accent-primary' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-accent-primary">
                        {selectedCategoryObj.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-text-primary leading-tight">{selectedCategoryObj.label}</p>
                        <p className="text-[10px] text-text-tertiary tracking-wider">Selecionado</p>
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-text-tertiary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-bg-primary border border-border-subtle rounded-2xl shadow-xl overflow-y-auto max-h-[300px] animate-in fade-in zoom-in-95 duration-200 z-50">
                      <div className="p-2 space-y-1">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              updateField('category', cat.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${formData.category === cat.id ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-secondary text-text-primary'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${formData.category === cat.id ? 'bg-accent-primary text-white shadow-glow' : 'bg-bg-tertiary text-text-tertiary'}`}>
                                {React.cloneElement(cat.icon as React.ReactElement, { size: 14 })}
                              </div>
                              <span className="text-sm font-medium">{cat.label}</span>
                            </div>
                            {formData.category === cat.id && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropdown Backdrop */}
                  {dropdownOpen && (
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center space-y-2">
                <h2 className="heading-xl tracking-tight text-text-primary">Defina o Valor</h2>
                <p className="text-sm text-text-tertiary">Como você deseja cobrar por este serviço?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateField('pricingMode', 'fixed')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 group ${formData.pricingMode === 'fixed' ? 'bg-text-primary border-text-primary text-bg-primary shadow-lg scale-[1.02]' : 'bg-bg-secondary border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                >
                  <div className={`p-3 rounded-full ${formData.pricingMode === 'fixed' ? 'bg-bg-primary/20' : 'bg-bg-tertiary'}`}>
                    <DollarSign size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-black tracking-widest mb-1">Preço Fixo</span>
                    <span className="text-[10px] opacity-70">Valor único por serviço</span>
                  </div>
                </button>

                <button
                  onClick={() => updateField('pricingMode', 'hourly')}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 group ${formData.pricingMode === 'hourly' ? 'bg-text-primary border-text-primary text-bg-primary shadow-lg scale-[1.02]' : 'bg-bg-secondary border-border-subtle text-text-secondary hover:border-text-tertiary'}`}
                >
                  <div className={`p-3 rounded-full ${formData.pricingMode === 'hourly' ? 'bg-bg-primary/20' : 'bg-bg-tertiary'}`}>
                    <Clock size={24} />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-black tracking-widest mb-1">Por Hora</span>
                    <span className="text-[10px] opacity-70">Cobrança por tempo</span>
                  </div>
                </button>
              </div>

              <div className="bg-bg-secondary border border-border-subtle rounded-3xl p-8 flex flex-col items-center justify-center gap-2 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl -z-10"></div>

                <p className="text-[10px] font-black tracking-widest text-text-tertiary">Valor Base</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-medium text-text-tertiary">R$</span>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => updateField('basePrice', e.target.value)}
                    className="bg-transparent border-none text-6xl font-black p-0 focus:ring-0 text-text-primary w-40 text-center tracking-tighter"
                    placeholder="00"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center space-y-2">
                <h2 className="heading-xl tracking-tight text-text-primary">Detalhes Finais</h2>
                <p className="text-sm text-text-tertiary">Descreva o que está incluso no seu serviço.</p>
              </div>

              <div className="bg-bg-secondary border border-border-subtle rounded-3xl p-1 shadow-sm">
                <textarea
                  rows={8}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ex: Inclui limpeza completa de pisos, janelas e móveis. Utilizo produtos próprios e biodegradáveis. Duração média de 2 horas..."
                  className="w-full bg-transparent border-none rounded-2xl p-6 text-base text-text-primary placeholder:text-text-tertiary/50 outline-none resize-none focus:ring-0"
                ></textarea>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Floating Action Footer */}
      <footer className="fixed bottom-6 left-6 right-6 max-w-lg mx-auto z-40">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-4 rounded-2xl bg-bg-secondary border border-border-subtle text-text-primary font-bold shadow-lg shadow-black/5 active:scale-95 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleFinish()}
            disabled={loading}
            className="flex-1 py-4 bg-accent-primary text-bg-primary font-black tracking-widest rounded-2xl shadow-xl shadow-accent-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {step === 3 ? (serviceId ? 'Atualizar' : 'Publicar') : 'Continuar'}
                {step < 3 && <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ChevronDown size={14} className="-rotate-90" /></span>}
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ServiceRegistration;
