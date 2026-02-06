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

    // Inscrição em tempo real para acompanhar mudanças no pedido
    let subscription: any;

    const setupSubscription = async () => {
      const orders: any[] = await getClientOrders();
      const active = orders?.find(o => !['completed', 'rejected', 'cancelled'].includes(o.status)) || orders?.[0];

      if (active) {
        const { subscribeToOrderUpdates } = await import('../services/ordersService');
        subscription = subscribeToOrderUpdates(active.id, (updatedOrder) => {
          setActiveOrder(updatedOrder);
        });
      }
    };

    setupSubscription();

    return () => {
      if (subscription) subscription.unsubscribe();
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

  if (loading) return <div className="container min-h-screen flex items-center justify-center meta-bold text-black dark:text-white">CARREGANDO...</div>;

  if (!activeOrder) {
    return (
      <div className="container min-h-screen p-10 flex flex-col items-center justify-center text-center animate-fade-in bg-app-bg">
        <div className="w-24 h-24 rounded-[32px] bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-8 shadow-sm">
          <ClipboardList size={40} className="text-black dark:text-neutral-600" />
        </div>
        <h2 className="heading-lg text-black dark:text-white">Nenhum pedido ativo</h2>
        <p className="body mt-2 max-w-[280px] text-black">Seus agendamentos ativos aparecerão aqui.</p>
        <button onClick={onBack} className="button--primary mt-10 !bg-primary-green !text-black border-none !px-8 label-semibold uppercase rounded-2xl">Voltar ao Início</button>
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
          <h2 className="heading-md uppercase tracking-widest text-[12px] text-black dark:text-white">Status do Pedido</h2>
          <p className="meta-bold text-black uppercase tracking-widest !text-[9px]">ID: #{activeOrder.id.slice(0, 8)}</p>
        </div>
        <button onClick={onSupport} className="w-10 h-10 flex items-center justify-center interactive">
          <LifeBuoy size={20} className="text-black dark:text-white" />
        </button>
      </header>

      <div className="py-8 space-y-8">
        <section className="px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800 p-8 shadow-sm">
            <h3 className="heading-md mb-8">{activeOrder.service?.title || 'Serviço'}</h3>

            <div className="space-y-0">
              <ProgressStep
                title="Pedido Enviado"
                desc={`Aguardando confirmação de ${providerName}`}
                icon={<ClipboardList size={18} />}
                active={currentStep >= 1}
                completed={currentStep > 1}
              />
              <ProgressStep
                title="Confirmado"
                desc="Profissional aceitou seu pedido"
                icon={<CheckCircle2 size={18} />}
                active={currentStep >= 2}
                completed={currentStep > 2}
              />
              <ProgressStep
                title="Pagamento Realizado"
                desc="Valor retido com segurança"
                icon={<CreditCard size={18} />}
                active={currentStep >= 3}
                completed={currentStep > 3}
              />
              <ProgressStep
                title="Confirmação de Início"
                desc={activeOrder.status === 'awaiting_start_confirmation' ? 'Confirme o início para liberar' : 'Início validado'}
                icon={<AlertCircle size={18} />}
                active={currentStep >= 4}
                completed={currentStep > 4}
                pulse={activeOrder.status === 'awaiting_start_confirmation'}
              />
              <ProgressStep
                title="Em Execução"
                desc="Serviço sendo realizado agora"
                icon={<Sparkles size={18} />}
                active={currentStep >= 5}
                completed={currentStep > 5}
                pulse={activeOrder.status === 'in_execution'}
              />
              <ProgressStep
                title="Concluído"
                desc="Serviço finalizado com sucesso"
                icon={<ShieldCheck size={18} />}
                active={currentStep >= 6}
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
                  <h4 className="heading-md !text-lg mb-0 text-white">Pagamento Pendente</h4>
                  <p className="meta-bold text-white/40 uppercase tracking-widest !text-[9px]">O profissional aceitou seu pedido!</p>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-white/60">Total do Serviço</span>
                  <span className="font-black text-white">R$ {activeOrder.total_amount?.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">O valor ficará retido com segurança até a conclusão.</p>
              </div>
              <button
                onClick={() => onPay?.(activeOrder)} // In App.tsx, we can handle the navigation
                className="w-full bg-primary-green text-black py-5 rounded-[20px] label-semibold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary-green/20"
              >
                Pagar Agora
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
                      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 meta-bold text-black dark:text-white">{providerName[0]}</div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-green border-2 border-white dark:border-neutral-900 rounded-full"></div>
                </div>
                <div>
                  <h4 className="heading-md mb-0 text-black dark:text-white">{providerName}</h4>
                  <p className="meta-bold text-black dark:text-neutral-400 mt-1 uppercase tracking-tight">Profissional Verificado</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 py-4 rounded-2xl label-semibold uppercase interactive flex items-center justify-center gap-2 text-sm">
                  <MessageSquare size={16} /> Chat
                </button>
                <button className="flex-1 bg-primary-black text-white dark:bg-white dark:text-black py-4 rounded-2xl label-semibold uppercase interactive flex items-center justify-center gap-2 text-sm">
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
                <p className="meta-bold uppercase tracking-widest text-[10px]">O Profissional indicou o início do serviço</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await confirmExecutionStart(activeOrder.id);
                    alert("Início confirmado!");
                    fetchActiveOrder();
                  } catch (e) { alert("Erro: " + e); }
                }}
                className="w-full bg-primary-green text-black py-5 rounded-2xl label-semibold uppercase shadow-xl"
              >
                Confirmar Presença/Início
              </button>
            </div>
          </div>
        )}

        {activeOrder.status === 'awaiting_finish_confirmation' && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 z-50">
            <div className="container !px-0 flex flex-col gap-4">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle size={16} className="text-black-green" />
                <p className="meta-bold uppercase tracking-widest text-[10px]">Profissional solicitou finalização</p>
              </div>
              <button
                onClick={handleConfirmFinish}
                className="w-full bg-primary-green text-black py-5 rounded-2xl label-semibold uppercase shadow-xl"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressStep = ({ title, desc, icon, active, completed, pulse, last }: any) => (
  <div className={`flex gap-8 ${last ? '' : 'min-h-[90px]'}`}>
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center z-10 transition-all duration-500 shadow-sm ${active ? 'bg-primary-green text-black' : 'bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-black'} ${pulse ? 'animate-pulse scale-105' : ''}`}>
        {icon}
      </div>
      {!last && <div className={`w-0.5 h-full ${active && completed ? 'bg-primary-green' : 'bg-neutral-100 dark:bg-neutral-800'}`}></div>}
    </div>
    <div className="pt-2 flex-1">
      <p className={`body-bold transition-colors ${active ? 'text-black dark:text-white' : 'text-black dark:text-white'}`}>{title}</p>
      {desc && <p className={`meta mt-1 leading-relaxed ${active ? 'text-black' : 'text-black opacity-70'}`}>{desc}</p>}
    </div>
  </div>
);

export default Tracking;
