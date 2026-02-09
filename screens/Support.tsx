import React, { useState, useRef, useEffect } from 'react';
import { getAISupport } from '../services/geminiService';
import { submitComplaint } from '../services/complaintsService';
import {
  ArrowLeft,
  Send,
  LifeBuoy,
  AlertTriangle,
  FileText,
  Shield,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'USER' | 'AGENT';
  text: string;
  time: string;
}

interface Props { onBack: () => void; }

const Support: React.FC<Props> = ({ onBack }) => {
  const [view, setView] = useState<'CHAT' | 'COMPLAINT'>('CHAT');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'AGENT',
      text: 'Olá! Eu sou seu assistente de IA. Como posso ajudar com seus serviços hoje?',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Complaint States
  const [complaintCategory, setComplaintCategory] = useState<'abuse' | 'harassment' | 'safety' | 'other'>('abuse');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintStatus, setComplaintStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (view === 'CHAT') {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages, view]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'USER',
      text: input,
      time: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await getAISupport(input);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'AGENT',
        text: response,
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        sender: 'AGENT',
        text: 'Desculpe, tive um problema ao processar sua solicitação. Tente novamente em alguns instantes.',
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc.trim()) return;

    setComplaintStatus('submitting');
    try {
      await submitComplaint({
        category: complaintCategory,
        description: complaintDesc,
      });
      setComplaintStatus('success');
      setTimeout(() => {
        setComplaintStatus('idle');
        setComplaintDesc('');
        setView('CHAT');
      }, 3000);
    } catch (error) {
      console.error(error);
      setComplaintStatus('error');
    }
  };

  const renderComplaintForm = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Canal de Denúncias</h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1 leading-relaxed">
            Use este canal para reportar violações graves, abuso, assédio ou questões de segurança. Sua identidade será preservada durante a investigação inicial.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitComplaint} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Tipo de Ocorrência</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'abuse', label: 'Abuso de Poder' },
              { id: 'harassment', label: 'Assédio' },
              { id: 'safety', label: 'Segurança' },
              { id: 'other', label: 'Outro' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setComplaintCategory(cat.id as any)}
                className={`p-3 rounded-lg border text-xs font-medium transition-all text-left ${complaintCategory === cat.id
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-text-secondary hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Descrição Detalhada</label>
          <textarea
            value={complaintDesc}
            onChange={(e) => setComplaintDesc(e.target.value)}
            placeholder="Descreva o ocorrido com o máximo de detalhes (datas, locais, pessoas envolvidas)..."
            className="w-full h-40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none"
            required
          />
        </div>

        <div className="pt-4">
          {complaintStatus === 'success' ? (
            <div className="w-full p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle size={20} />
              <span className="font-medium">Denúncia registrada com sucesso.</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={complaintStatus === 'submitting' || !complaintDesc.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {complaintStatus === 'submitting' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Enviar Denúncia
                </>
              )}
            </button>
          )}

          {complaintStatus === 'error' && (
            <p className="text-center text-red-500 text-xs mt-2">Erro ao enviar. Tente novamente.</p>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col h-screen transition-colors bg-app-bg animate-fade-in relative">
      {/* Header */}
      <header className="profile-bar safe-area-top sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-black/90 flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => view === 'COMPLAINT' ? setView('CHAT') : onBack()}
          className="w-10 h-10 flex items-center justify-center interactive rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeft size={20} className="text-black dark:text-white" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="heading-md text-[14px]">{view === 'CHAT' ? 'Suporte Inteligente' : 'Denúncia Formal'}</h2>
          <p className="text-text-tertiary font-normal !text-[10px]">
            {view === 'CHAT' ? 'Assistente Virtual' : 'Canal Confidencial'}
          </p>
        </div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      {/* Main Content */}
      {view === 'CHAT' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-40">
            {/* Intro Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                  <LifeBuoy size={20} className="text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">Precisa de ajuda?</h3>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                    Estou aqui para tirar dúvidas sobre a plataforma, pagamentos e serviços.
                  </p>
                </div>
              </div>
            </div>

            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[20px] shadow-sm leading-relaxed text-sm ${m.sender === 'USER'
                  ? 'bg-black text-white rounded-br-none dark:bg-white dark:text-black'
                  : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-100 dark:border-neutral-800 rounded-bl-none'
                  }`}>
                  <p>{m.text}</p>
                  <p className={`mt-1 opacity-40 text-[9px] ${m.sender === 'USER' ? 'text-right' : 'text-left'}`}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-3 rounded-[16px] rounded-bl-none animate-pulse text-text-secondary text-xs flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Digitando...
                </div>
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="p-4 safe-area-bottom border-t border-neutral-100 dark:border-neutral-900 bg-white/95 dark:bg-black/95 backdrop-blur-md">

            {/* Special Action: Report Abuse */}
            <button
              onClick={() => setView('COMPLAINT')}
              className="w-full mb-4 py-2 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-100 dark:border-red-900/30"
            >
              <Shield size={14} />
              Reportar Abuso ou Violação de Direitos
            </button>

            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 p-1.5 pl-4 rounded-full border border-neutral-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/10 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-black dark:text-white placeholder:text-text-tertiary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center interactive disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        renderComplaintForm()
      )}
    </div>
  );
};

export default Support;
