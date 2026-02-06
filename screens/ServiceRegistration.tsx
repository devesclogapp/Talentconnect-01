import React, { useState, useEffect } from 'react';
import { createService, updateService, getServiceById } from '../services/servicesService';

interface Props {
  onBack: () => void;
  onComplete: () => void;
  serviceId?: string; // ID do serviço para edição
}

const ServiceRegistration: React.FC<Props> = ({ onBack, onComplete, serviceId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(!!serviceId);
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
      console.log('ServiceRegistration montado. serviceId:', serviceId);

      if (!serviceId) {
        setLoadingService(false);
        return;
      }

      try {
        setLoadingService(true);
        console.log('Carregando serviço:', serviceId);
        const service = await getServiceById(serviceId);

        if (!service) {
          throw new Error('Serviço não encontrado');
        }

        setFormData({
          title: service.title || '',
          category: service.category || 'Limpeza',
          basePrice: String(service.base_price || 50),
          description: service.description || '',
          durationHours: String(service.duration_hours || 1),
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
        duration_hours: parseFloat(formData.durationHours),
        active: true
      };

      if (serviceId) {
        // Modo de edição
        console.log('Atualizando serviço:', serviceId, servicePayload);
        await updateService(serviceId, servicePayload);
        alert('Serviço atualizado com sucesso!');
      } else {
        // Modo de criação
        console.log('Criando novo serviço:', servicePayload);
        await createService(servicePayload);
        alert('Serviço criado com sucesso!');
      }

      onComplete();
    } catch (error: any) {
      console.error("Erro ao salvar serviço:", error);
      alert("Erro ao salvar serviço: " + (error.message || "Tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-app-bg min-h-screen transition-colors">
      <header className="sticky top-0 z-50 bg-card-bg border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-app-text">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="heading-md uppercase tracking-widest">{serviceId ? 'Editar Serviço' : 'Novo Serviço'}</h1>
        <div className="w-10 meta-bold text-brand-primary !text-[10px]">{step}/3</div>
      </header>

      {loadingService ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto"></div>
            <p className="meta-bold text-app-text-muted uppercase tracking-widest">Carregando serviço...</p>
          </div>
        </div>
      ) : (

        <main className="p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="heading-xl text-app-text leading-tight">O que você vai oferecer?</h2>
                <p className="meta-bold text-app-text-muted uppercase tracking-tighter">Escolha um nome atraente e curto</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="meta-bold text-app-text-muted uppercase tracking-widest px-1 !text-[10px]">Título do Serviço</label>
                  <input
                    type="text"
                    placeholder="Ex: Limpeza Pesada VIP"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700 rounded-2xl p-4 body-bold text-app-text focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="meta-bold text-app-text-muted uppercase tracking-widest px-1 !text-[10px]">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700 rounded-2xl p-4 body-bold text-app-text focus:ring-brand-primary"
                  >
                    <option>Limpeza</option>
                    <option>Reparos</option>
                    <option>Beleza</option>
                    <option>Elétrica</option>
                    <option>Hidráulica</option>
                    <option>Saúde</option>
                    <option>Pet</option>
                    <option>Mudança</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="heading-xl text-app-text leading-tight">Valor e Modo</h2>
                <p className="meta-bold text-app-text-muted uppercase tracking-tighter">Quanto você cobra?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateField('pricingMode', 'fixed')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.pricingMode === 'fixed' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-100 dark:border-zinc-800 text-app-text-muted'}`}
                >
                  <span className="material-symbols-outlined">payments</span>
                  <span className="meta-bold uppercase !text-[10px]">Preço Fixo</span>
                </button>
                <button
                  onClick={() => updateField('pricingMode', 'hourly')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.pricingMode === 'hourly' ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-100 dark:border-zinc-800 text-app-text-muted'}`}
                >
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="meta-bold uppercase !text-[10px]">Por Hora</span>
                </button>
              </div>

              <div className="bg-brand-primary/5 border-2 border-brand-primary/20 rounded-3xl p-8 flex items-center justify-center gap-4">
                <span className="heading-xl text-brand-primary !text-3xl">R$</span>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => updateField('basePrice', e.target.value)}
                  className="bg-transparent border-none heading-xl p-0 focus:ring-0 text-app-text w-32 !text-6xl"
                />
              </div>
              <p className="text-center meta text-app-text-muted uppercase tracking-widest !text-[10px]">Valor base para o serviço</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="heading-xl text-app-text leading-tight">Quase pronto!</h2>
                <p className="meta-bold text-app-text-muted uppercase tracking-tighter">Adicione uma descrição</p>
              </div>

              <textarea
                rows={6}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descreva o que está incluído no seu serviço e sua experiência..."
                className="w-full bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700 rounded-2xl p-4 body text-app-text focus:ring-brand-primary"
              ></textarea>
            </div>
          )}
        </main>
      )}

      <footer className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl z-50">
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 text-app-text-muted label-semibold uppercase tracking-widest !text-[10px]"
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleFinish()}
            disabled={loading}
            className="flex-[2] py-4 bg-brand-primary text-white label-semibold uppercase rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 !text-[10px]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              step === 3 ? (serviceId ? 'Atualizar Serviço' : 'Publicar Serviço') : 'Continuar'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ServiceRegistration;
