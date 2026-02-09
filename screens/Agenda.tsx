import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Home,
  Wallet,
  Calendar,
  User as UserIcon,
  Clock,
  MapPin,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { getProviderOrders, acceptOrder } from '../services/ordersService';
import { resolveUserName } from '../utils/userUtils';

interface Props {
  onBack: () => void;
  onNavigate: (v: string) => void;
}

const Agenda: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [selectedDateString, setSelectedDateString] = useState(new Date().toDateString());
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate next 7 days
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
      date: d.getDate(),
      dateString: d.toDateString()
    };
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getProviderOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAction = async (orderId: string, action: 'ACCEPT') => {
    try {
      if (action === 'ACCEPT') {
        await acceptOrder(orderId);
        fetchOrders(); // Refresh
      }
    } catch (e) {
      alert("Erro ao performar ação: " + e);
    }
  };

  const filteredJobs = orders.filter(order => {
    const orderDate = new Date(order.scheduled_at || order.created_at).toDateString();
    return orderDate === selectedDateString;
  });

  return (
    <div className="bg-app-bg min-h-screen pb-32 transition-colors animate-fade-in">
      <header className="profile-bar safe-area-top sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-black/90 px-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center interactive">
          <ArrowLeft size={20} className="text-black dark:text-white" />
        </button>
        <h1 className="heading-md tracking-widest text-[12px] flex-1 text-center">Minha Agenda</h1>
        <div className="w-10"></div>
      </header>

      <main>
        {/* Horizontal Calendar */}
        <section className="py-6 px-4 bg-white dark:bg-black border-b border-neutral-100 dark:border-neutral-900 overflow-x-auto no-scrollbar">
          <div className="flex justify-between gap-3">
            {upcomingDays.map((d) => {
              // Get orders for this day
              const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.scheduled_at || o.created_at).toDateString();
                return orderDate === d.dateString;
              });

              let dotColor = null;

              if (dayOrders.length > 0) {
                // Priority: Active > Completed > Cancelled
                const hasActive = dayOrders.some(o => !['completed', 'cancelled', 'rejected'].includes(o.status));
                const hasCompleted = dayOrders.some(o => o.status === 'completed');
                const hasCancelled = dayOrders.some(o => ['cancelled', 'rejected'].includes(o.status));

                if (hasActive) dotColor = 'bg-blue-500';
                else if (hasCompleted) dotColor = 'bg-black dark:bg-white';
                else if (hasCancelled) dotColor = 'bg-red-500';
              }

              const isSelected = selectedDateString === d.dateString;

              // If selected (Black BG), a Black dot is invisible, so force it to White.
              // Other colors (Blue/Red) are visible on Black.
              // Note: 'bg-black dark:bg-white' handles standard 'completed' state.
              if (isSelected && dotColor === 'bg-black dark:bg-white') {
                dotColor = 'bg-white';
              }

              return (
                <button
                  key={d.dateString}
                  onClick={() => setSelectedDateString(d.dateString)}
                  className={`relative flex flex-col items-center justify-center p-3 min-w-[55px] rounded-2xl transition-all border shadow-sm ${isSelected ? 'bg-primary-black text-white border-primary-black shadow-lg shadow-black/10' : 'bg-bg-secondary border-border-subtle text-text-primary'}`}
                >
                  <span className={`meta-bold !text-[9px] tracking-tighter mb-1 ${isSelected ? 'opacity-70' : 'opacity-40'}`}>{d.name}</span>
                  <span className="body-bold">{d.date}</span>
                  {dotColor && (
                    <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Jobs List */}
        <section className="p-4 space-y-4">
          {loading ? (
            <div className="py-20 text-center w-full meta">Carregando agenda...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
              <Calendar size={60} strokeWidth={1} />
              <p className="caption-bold mt-4">Agenda Vazia</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 p-6 rounded-[28px] relative overflow-hidden shadow-sm interactive">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${job.status === 'sent' ? 'bg-warning' : job.status === 'in_execution' ? 'bg-primary-green animate-pulse' : 'bg-neutral-200'}`}></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="heading-md mb-1 text-text-primary">{job.service?.title || 'Serviço'}</h3>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Clock size={12} className="text-accent-primary" />
                        <span className="meta-bold tracking-tight">
                          {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {job.status === 'completed' ? (
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                        CONCLUÍDO
                      </span>
                    ) : (
                      <span className="badge badge--success">
                        {job.status.toUpperCase().replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin size={14} className="text-accent-primary" />
                    <p className="meta font-medium">{resolveUserName(job.client)} • {job.location_text || 'Local'}</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    {job.status === 'sent' && (
                      <button onClick={() => handleAction(job.id, 'ACCEPT')} className="flex-1 button--primary !bg-primary-green !text-black !rounded-xl !min-h-[48px] label-semibold tracking-widest">Aceitar Pedido</button>
                    )}
                    {job.status === 'accepted' && (
                      <div className="flex-1 py-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-center border border-neutral-100 dark:border-neutral-800">
                        <p className="meta-bold text-black-green-dark tracking-wide">Pedido Confirmado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>


    </div>
  );
};

export default Agenda;
