
import React from 'react';

interface Props { onBack: () => void; }

const NotificationCenter: React.FC<Props> = ({ onBack }) => {
  const notifications = [
    { id: 1, title: 'Nova Proposta!', body: 'Luiza enviou um ajuste para seu orçamento.', time: '5 min atrás', unread: true, icon: 'payments', color: 'bg-orange-100 text-orange-600' },
    { id: 2, title: 'Serviço Confirmado', body: 'Seu agendamento com Alex foi aceito.', time: '1h atrás', unread: false, icon: 'check_circle', color: 'bg-feedback-success/10 text-feedback-success' },
    { id: 3, title: 'Mensagem Nova', body: 'Sarah: "Estou a caminho da sua residência."', time: '2h atrás', unread: false, icon: 'chat', color: 'bg-blue-100 text-blue-600' }
  ];

  return (
    <div className="bg-app-bg min-h-screen transition-colors">
      <header className="sticky top-0 z-50 bg-card-bg border-b border-gray-100 dark:border-gray-800 px-2 py-4 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-app-text">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="heading-md uppercase tracking-widest">Notificações</h1>
        <div className="w-10"></div>
      </header>

      <main className="p-4 space-y-3">
        {notifications.map(notif => (
          <div key={notif.id} className={`p-5 rounded-3xl border flex gap-4 transition-all ${notif.unread ? 'bg-white dark:bg-zinc-800/50 border-brand-primary' : 'bg-card-bg border-gray-100 dark:border-zinc-800 opacity-70'}`}>
            <div className={`w-12 h-12 rounded-2xl ${notif.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined">{notif.icon}</span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="body-bold text-app-text">{notif.title}</h3>
                <span className="meta-bold text-app-text-muted">{notif.time}</span>
              </div>
              <p className="meta text-app-text-muted leading-relaxed">{notif.body}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default NotificationCenter;
