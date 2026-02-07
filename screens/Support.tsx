import React, { useState, useRef, useEffect } from 'react';
import { getAISupport } from '../services/geminiService';
import { User } from '../types';

interface Message {
  id: string;
  sender: 'USER' | 'AGENT';
  text: string;
  time: string;
}

interface Props { onBack: () => void; }

import {
  ArrowLeft,
  Send,
  LifeBuoy
} from 'lucide-react';

const Support: React.FC<Props> = ({ onBack }) => {
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

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

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

  return (
    <div className="flex flex-col h-screen transition-colors bg-app-bg animate-fade-in relative">
      {/* Profile Bar (Reuse for Header) */}
      <header className="profile-bar safe-area-top sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-black/90">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center interactive">
          <ArrowLeft size={20} className="text-black dark:text-white" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="heading-md tracking-widest text-[12px]">Suporte por IA</h2>
          <p className="meta-bold text-black-green tracking-widest !text-[9px]">Justlife Intelligent Assistant</p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar pb-10">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[24px] shadow-sm leading-relaxed ${m.sender === 'USER' ? 'bg-primary-black text-white rounded-br-none' : 'bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-100 dark:border-neutral-800 rounded-bl-none'}`}>
              <p className="body !leading-snug">{m.text}</p>
              <p className={`meta-bold mt-2 opacity-30 !text-[9px] tracking-tighter ${m.sender === 'USER' ? 'text-right' : 'text-left'}`}>
                {m.time}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-50 dark:bg-neutral-900 px-6 py-4 rounded-[20px] rounded-bl-none animate-pulse text-black meta-bold tracking-widest border border-neutral-100 dark:border-neutral-800">
              Processando resposta...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 safe-area-bottom border-t border-neutral-100 dark:border-neutral-900 bg-white/95 dark:bg-black/95 backdrop-blur-md">
        <div className="flex items-center gap-4 bg-neutral-100 dark:bg-neutral-900 p-2 pl-6 rounded-full border border-neutral-50 dark:border-neutral-800 shadow-inner">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Descreva seu problema..."
            className="flex-1 bg-transparent border-none focus:ring-0 body-small px-0 py-3 text-black dark:text-white placeholder:text-black"
          />
          <button onClick={handleSend} className="w-12 h-12 bg-primary-green text-black rounded-full flex items-center justify-center interactive shadow-lg">
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;
