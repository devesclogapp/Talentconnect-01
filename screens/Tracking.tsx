import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  MessageSquare,
  Phone,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  CheckCircle,
  LifeBuoy,
  CreditCard
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { getClientOrders, confirmExecutionFinish, confirmExecutionStart } from '../services/ordersService';
import { formatNumber } from '../utils/format';

interface Props {
  onBack: () => void;
  onSupport: () => void;
  onPay?: (order: any) => void;
}

const Tracking: React.FC<Props> = ({ onBack, onSupport, onPay }) => {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrder = async () => {
    try {
      setLoading(true);
      const orders: any[] = await getClientOrders();
      // Encontrar o pedido mais recente que não esteja concluído ou cancelado
      const active = orders?.find(o => !['completed', 'rejected', 'cancelled'].includes(o.status)) || orders?.[0];
      setActiveOrder(active);
    } catch (error) {
      console.error("Erro ao carregar pedido ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrder();

    let subscription: any;

    const setup = async () => {
      try {
        const orders: any[] = await getClientOrders();
        const active = orders?.find(o => !['completed', 'rejected', 'cancelled'].includes(o.status)) || orders?.[0];

        if (active) {
          const { subscribeToOrderUpdates, getOrderById } = await import('../services/ordersService');
          subscription = subscribeToOrderUpdates(active.id, async () => {
            try {
              const updatedOrder = await getOrderById(active.id);
              setActiveOrder(updatedOrder);
            } catch (error) {
              console.error("Erro ao atualizar pedido:", error);
            }
          });
        }
      } catch (error) {
        console.error("Erro ao configurar inscrição de tempo real:", error);
      }
    };

    setup();

    return () => {
      // Small delay check to avoid trying to unsubscribe before assignment in async race
      setTimeout(() => {
        if (subscription) subscription.unsubscribe();
      }, 0);
    };
  }, []);

  const handleConfirmFinish = async () => {
    if (!activeOrder) return;
    try {
      await confirmExecutionFinish(activeOrder.id);
      alert("Serviço confirmado com sucesso!");
      fetchActiveOrder();
    } catch (e) {
      alert("Erro ao confirmar: " + e);
    }
  };

  if (loading) return <div className="container min-h-screen flex items-center justify-center font-normal text-black dark:text-white">Carregando...</div>;

  if (!activeOrder) {
    return (
      <div className="container min-h-screen p-10 flex flex-col items-center justify-center text-center animate-fade-in bg-app-bg">
        <div className="w-24 h-24 rounded-[32px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-8 shadow-sm">
          <ClipboardList size={40} className="text-black dark:text-neutral-600" />
        </div>
        <h2 className="heading-lg text-black dark:text-white">Nenhum pedido ativo</h2>
        <p className="body mt-2 max-w-[280px] text-black">Seus agendamentos ativos aparecerão aqui.</p>
        <button onClick={onBack} className="button--primary mt-10 !bg-primary-green !text-black border-none !px-8 font-normal rounded-2xl">Voltar ao início</button>
      </div>
    );
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'sent': return 1;
      case 'accepted': return 2;
      case 'paid_escrow_held': return 3;
      case 'awaiting_start_confirmation': return 4;
      case 'in_execution': case 'awaiting_finish_confirmation': return 5;
      case 'completed': return 6;
      default: return 1;
    }
  };

  const currentStep = getStatusStep(activeOrder.status);
  const providerName = activeOrder.provider?.name || 'Profissional';

  return (
    <div className="min-h-screen pb-24 transition-colors animate-fade-in bg-app-bg">
      <header className="profile-bar safe-area-top sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-black/90 px-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center interactive">
          <ArrowLeft size={20} className="text-black dark:text-white" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="heading-md text-[12px] text-black dark:text-white leading-none">Status do pedido</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <p className="text-black font-normal !text-xs">ID: #{activeOrder.id.slice(0, 8)}</p>
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
        <button onClick={onSupport} className="w-10 h-10 flex items-center justify-center interactive">
          <LifeBuoy size={20} className="text-black dark:text-white" />
        </button>
      </header>

      <div className="py-8 space-y-8">
        <section className="px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
            <h3 className="heading-md mb-8">{activeOrder.service?.title || 'Serviço'}</h3>

            <div className="space-y-0 relative">
              {/* Line Background - Absolute to ensure continuity, though flex col usually handles it. 
                  We will stick to component-based lines for simpler logic if adjusted correctly. 
              */}

              <ProgressStep
                title="Pedido Enviado"
                desc={`Aguardando confirmação de ${providerName}`}
                icon={<ClipboardList size={18} />}
                active={currentStep >= 1}
                completed={currentStep > 1}
              />

              <IntermediateStep
                label="Aguardando profissional aceitar no app"
                active={currentStep === 1}
                completed={currentStep > 1}
                variant="warning"
              />

              <ProgressStep
                title="Confirmado"
                desc="Profissional aceitou seu pedido"
                icon={<CheckCircle2 size={18} />}
                active={currentStep >= 2}
                completed={currentStep > 2}
              />

              <IntermediateStep
                label="Pagamento necessário para prosseguir"
                active={currentStep === 2}
                completed={currentStep > 2}
              />

              <ProgressStep
                title="Pagamento Realizado"
                desc="Valor retido com segurança"
                icon={<CreditCard size={18} />}
                active={currentStep >= 3}
                completed={currentStep > 3}
              />

              <IntermediateStep
                label="Profissional deve iniciar o serviço"
                active={currentStep === 3}
                completed={currentStep > 3}
                variant="warning"
              />

              <ProgressStep
                title="Confirmação de Início"
                desc={activeOrder.status === 'awaiting_start_confirmation' ? 'Confirme o início para liberar' : 'Início validado'}
                icon={<AlertCircle size={18} />}
                active={currentStep >= 4}
                completed={currentStep > 4}
                pulse={activeOrder.status === 'awaiting_start_confirmation'}
              />

              <IntermediateStep
                label="Serviço em andamento"
                active={currentStep === 4} // Actually this is transition to execution
                completed={currentStep > 4}
              />

              <ProgressStep
                title="Em Execução"
                desc="Serviço sendo realizado agora"
                icon={<Sparkles size={18} />}
                active={currentStep >= 5}
                completed={currentStep > 5}
                pulse={activeOrder.status === 'in_execution'}
              />

              <IntermediateStep
                label="Profissional deve marcar como concluído"
                active={currentStep === 5}
                completed={currentStep > 5 || activeOrder.status === 'awaiting_finish_confirmation'}
                variant="warning"
              />

              <ProgressStep
                title="Conclusão"
                desc={activeOrder.status === 'awaiting_finish_confirmation' ? 'Confirme a finalização' : 'Serviço finalizado'}
                icon={<ShieldCheck size={18} />}
                active={currentStep >= 6 || activeOrder.status === 'awaiting_finish_confirmation'}
                completed={currentStep >= 6}
                last
              />
            </div>
          </div>
        </section>

        {activeOrder.status === 'accepted' && (
          <section className="px-4">
            <Card className="p-8 border-none bg-primary-black text-white rounded-[32px] shadow-2xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-black-green">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 className="heading-md !text-lg mb-0 text-white">Pagamento pendente</h4>
                  <p className="text-white/40 font-normal !text-xs">O profissional aceitou seu pedido!</p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-black text-white tracking-[0.12em] opacity-40">Total à pagar</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-white opacity-40">R$</span>
                    <span className="text-2xl font-bold text-white tracking-tighter">
                      {formatNumber(activeOrder.total_amount)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/30 font-normal">O valor ficará retido com segurança até a conclusão.</p>
              </div>
              <button
                onClick={() => onPay?.(activeOrder)} // In App.tsx, we can handle the navigation
                className="w-full bg-primary-green text-black py-5 rounded-[20px] font-normal active:scale-95 transition-all shadow-lg shadow-primary-green/20"
              >
                Pagar agora
              </button>
            </Card>
          </section>
        )}

        {currentStep >= 2 && activeOrder.status !== 'accepted' && (
          <section className="px-4">
            <div className="bg-primary-green/5 dark:bg-primary-green/10 border border-primary-green/10 rounded-[32px] p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-primary-green p-0.5 overflow-hidden">
                    {activeOrder.provider?.avatar_url ? (
                      <img src={activeOrder.provider.avatar_url} alt="Provider" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 font-normal text-black dark:text-white">{providerName[0]}</div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-green border-2 border-white dark:border-neutral-900 rounded-full"></div>
                </div>
                <div>
                  <h4 className="heading-md mb-0 text-black dark:text-white">{providerName}</h4>
                  <p className="text-black dark:text-neutral-400 mt-1 font-normal text-xs">Profissional verificado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 py-4 rounded-2xl font-normal interactive flex items-center justify-center gap-2 text-sm">
                  <MessageSquare size={16} /> Chat
                </button>
                <button className="flex-1 bg-primary-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-normal interactive flex items-center justify-center gap-2 text-sm">
                  <Phone size={16} /> Ligar
                </button>
              </div>
            </div>
          </section>
        )}

        {activeOrder.status === 'awaiting_start_confirmation' && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 z-50">
            <div className="container !px-0 flex flex-col gap-4">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle size={16} className="text-black-green" />
                <p className="font-normal text-xs">O profissional indicou o início do serviço</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await confirmExecutionStart(activeOrder.id);
                    alert("Início confirmado!");
                    fetchActiveOrder();
                  } catch (e) { alert("Erro: " + e); }
                }}
                className="w-full bg-primary-green text-black py-5 rounded-2xl font-normal shadow-xl"
              >
                Confirmar presença/início
              </button>
            </div>
          </div>
        )}

        {activeOrder.status === 'awaiting_finish_confirmation' && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 z-50">
            <div className="container !px-0 flex flex-col gap-4">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle size={16} className="text-black-green" />
                <p className="font-normal text-xs">Profissional solicitou finalização</p>
              </div>
              <button
                onClick={handleConfirmFinish}
                className="w-full bg-primary-green text-black py-5 rounded-2xl font-normal shadow-xl"
              >
                Confirmar conclusão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressStep = ({ title, desc, icon, active, completed, pulse, last, variant = 'success' }: any) => {
  let bgStyle = { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6' };
  let iconColor = '#9CA3AF';
  let titleColor = '#6B7280';

  if (completed) {
    bgStyle = { backgroundColor: '#10B981', borderColor: '#10B981' };
    iconColor = '#FFFFFF';
    titleColor = '#10B981';
  } else if (active) {
    const color = variant === 'info' ? '#3B82F6' : '#FF6B00';
    bgStyle = { backgroundColor: color, borderColor: color };
    iconColor = '#FFFFFF';
    titleColor = '#111111';
  }

  return (
    <div className={`flex gap-8 ${last ? '' : 'min-h-[90px]'}`}>
      <div className="flex flex-col items-center">
        <div
          style={bgStyle}
          className={`w-12 h-12 rounded-[20px] border flex items-center justify-center z-10 transition-all duration-500 shadow-sm ${pulse ? 'animate-pulse scale-105 shadow-glow' : ''}`}
        >
          <div style={{ color: iconColor }}>
            {completed ? <CheckCircle2 size={18} /> : icon}
          </div>
        </div>
        {!last && (
          <div
            style={{ backgroundColor: completed ? (variant === 'info' ? '#3B82F6' : variant === 'warning' ? '#F59E0B' : '#10B981') : '#F3F4F6' }}
            className={`w-0.5 h-full`}
          ></div>
        )}
      </div>
      <div className="pt-2 flex-1">
        <p className={`font-bold transition-colors`} style={{ color: titleColor }}>{title}</p>
        {desc && <p className={`text-xs font-normal mt-1 leading-relaxed ${active ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 dark:text-neutral-600'}`}>{desc}</p>}
      </div>
    </div>
  );
};

const IntermediateStep = ({ label, active, completed, variant = 'warning' }: any) => {
  let dotColor = '#E5E7EB';
  let textColor = '#9CA3AF';
  let lineColor = '#F3F4F6';

  if (completed) {
    lineColor = variant === 'info' ? '#3B82F6' : variant === 'warning' ? '#F59E0B' : '#10B981';
    dotColor = lineColor;
    textColor = '#6B7280';
  } else if (active) {
    dotColor = variant === 'info' ? '#3B82F6' : '#F59E0B';
    textColor = dotColor;
  }

  return (
    <div className="flex gap-8 min-h-[40px] -mt-2 -mb-2 relative z-0">
      <div className="flex flex-col items-center w-12">
        <div style={{ backgroundColor: lineColor }} className="w-0.5 h-full absolute top-0 bottom-0"></div>
        <div
          style={{ backgroundColor: dotColor }}
          className={`w-3 h-3 rounded-full z-10 my-auto flex items-center justify-center transition-all ${active ? 'animate-pulse ring-4 ring-opacity-20 ' + (variant === 'warning' ? 'ring-amber-500' : 'ring-blue-500') : 'border-2 border-white'}`}
        >
        </div>
      </div>
      <div className="py-3 flex-1">
        <p style={{ color: textColor }} className={`text-xs font-normal transition-colors`}>
          {label}
        </p>
      </div>
    </div>
  );
};

export default Tracking;
