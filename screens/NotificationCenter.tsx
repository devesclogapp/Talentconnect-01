import React, { useState } from 'react';
import { ArrowLeft, Bell, MessageSquare, CheckCircle, Package, Info, ChevronRight, Settings, Trash2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const NotificationCenter: React.FC<Props> = ({ onBack }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Nova Proposta!',
      body: 'Luiza enviou um ajuste para seu orçamento de Design de Logotipo.',
      time: '5 min atrás',
      unread: true,
      type: 'deal',
      icon: <Package size={18} />,
      color: 'text-warning bg-warning/10'
    },
    {
      id: 2,
      title: 'Serviço Confirmado',
      body: 'Seu agendamento com Alex Silveira foi aceito com sucesso.',
      time: '1h atrás',
      unread: false,
      type: 'check',
      icon: <CheckCircle size={18} />,
      color: 'text-success bg-success/10'
    },
    {
      id: 3,
      title: 'Mensagem Nova',
      body: 'Sarah: "Estou a caminho da sua residência para iniciar o serviço."',
      time: '2h atrás',
      unread: false,
      type: 'message',
      icon: <MessageSquare size={18} />,
      color: 'text-accent-primary bg-accent-primary/10'
    },
    {
      id: 4,
      title: 'Atualização de Sistema',
      body: 'Novas funcionalidades de segurança foram habilitadas na sua conta.',
      time: 'Ontem',
      unread: false,
      type: 'info',
      icon: <Info size={18} />,
      color: 'text-text-tertiary bg-bg-secondary'
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
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
            onClick={markAllRead}
            className="text-[9px] font-black uppercase text-accent-primary tracking-widest hover:opacity-80 transition-opacity"
          >
            Marcar todas como lidas
          </button>
        </div>

        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-5 rounded-[24px] border transition-all flex gap-4 group cursor-pointer active:scale-[0.98] ${notif.unread
                    ? 'bg-bg-primary border-accent-primary/20 shadow-glow-subtle'
                    : 'bg-bg-secondary/20 border-border-subtle opacity-70 hover:opacity-100'
                  }`}
              >
                <div className={`w-12 h-12 rounded-2xl ${notif.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                  {notif.icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-text-primary leading-tight">{notif.title}</h3>
                    <span className="text-[9px] font-medium text-text-tertiary whitespace-nowrap ml-2">{notif.time}</span>
                  </div>
                  <p className="text-[11px] text-text-tertiary leading-relaxed font-normal">{notif.body}</p>
                </div>
                {notif.unread && (
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
