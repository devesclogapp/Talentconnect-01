import React from 'react';
import { ArrowLeft, Bell, MessageSquare, CheckCircle, Package, Info, ChevronRight, Settings, Trash2, Clock, Scale } from 'lucide-react';
import { getMyNotifications, markAllAsRead, Notification } from '../services/notificationsService';

interface Props {
  onBack: () => void;
}

const NotificationCenter: React.FC<Props> = ({ onBack }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getMyNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deal': return <Package size={18} />;
      case 'check': return <CheckCircle size={18} />;
      case 'message': return <MessageSquare size={18} />;
      case 'dispute_resolved': return <Scale size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'deal': return 'text-warning bg-warning/10';
      case 'check': return 'text-success bg-success/10';
      case 'message': return 'text-accent-primary bg-accent-primary/10';
      case 'dispute_resolved': return 'text-primary bg-primary/10';
      default: return 'text-text-tertiary bg-bg-secondary';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-bg-primary min-h-screen animate-fade-in pb-20">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary leading-tight">Notificações</h1>
            <p className="text-[11px] text-text-tertiary font-normal">Fique por dentro das atualizações</p>
          </div>
        </div>
        <button
          onClick={() => { }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary text-text-tertiary"
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-4">
        {/* Mark all as read button */}
        <div className="flex justify-between items-center px-1 pb-2">
          <h2 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest leading-none">Recentes</h2>
          <button
            onClick={handleMarkAllRead}
            className="text-[9px] font-black uppercase text-accent-primary tracking-widest hover:opacity-80 transition-opacity"
          >
            Marcar todas como lidas
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Clock size={32} className="mx-auto mb-4 text-text-tertiary animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Sincronizando...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-5 rounded-[24px] border transition-all flex gap-4 group cursor-pointer active:scale-[0.98] ${!notif.read
                  ? 'bg-bg-primary border-accent-primary/20 shadow-glow-subtle'
                  : 'bg-bg-secondary/20 border-border-subtle opacity-70 hover:opacity-100'
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl ${getColor(notif.type)} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-text-primary leading-tight">{notif.title}</h3>
                    <span className="text-[9px] font-medium text-text-tertiary whitespace-nowrap ml-2">{formatRelativeTime(notif.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed font-normal">{notif.body}</p>
                </div>
                {!notif.read && (
                  <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-accent-primary rounded-full"></div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <Bell size={48} className="mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma notificação por aqui</p>
            </div>
          )}
        </div>

        {/* Footnote */}
        <div className="pt-10 flex flex-col items-center gap-4">
          <button className="flex items-center gap-2 text-[10px] font-black uppercase text-error/60 hover:text-error transition-colors">
            <Trash2 size={12} /> Limpar histórico
          </button>
        </div>
      </main>
    </div>
  );
};

export default NotificationCenter;
