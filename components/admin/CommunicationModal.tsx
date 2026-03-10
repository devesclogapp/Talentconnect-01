import React, { useState } from 'react';

interface CommunicationModalProps {
    onClose: () => void;
    onSend: (data: { title: string; segment: string }) => void;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({ onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const [segment, setSegment] = useState('all');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <div className="bg-bg-primary w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden border border-accent-primary/20 animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-border-subtle bg-accent-primary/5">
                    <h2 className="text-2xl font-black text-text-primary mb-2">Canal de Transmissão</h2>
                    <p className="text-[11px] text-text-tertiary font-medium">Envie comunicados segmentados para a base de usuários.</p>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">Público Alvo</label>
                                <select
                                    value={segment}
                                    onChange={(e) => setSegment(e.target.value)}
                                    className="w-full h-12 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-xs font-bold"
                                >
                                    <option value="all">Toda a Base</option>
                                    <option value="providers">Profissionais</option>
                                    <option value="clients">Clientes</option>
                                    <option value="kyc_pending">KYC Pendente</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">Tipo de Alerta</label>
                                <select className="w-full h-12 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-[13px] font-bold">
                                    <option>Informativo</option>
                                    <option>Manutenção</option>
                                    <option>Urgente</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">Mensagem</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-14 bg-bg-secondary border border-border-subtle rounded-xl px-4 text-[15px] font-bold outline-none focus:border-accent-primary"
                                placeholder="Título do Comunicado..."
                            />
                            <textarea className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-2xl p-4 text-[13px] font-medium outline-none" placeholder="Conteúdo da mensagem..." />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-[11px] font-black uppercase tracking-widest">Descartar</button>
                        <button onClick={() => onSend({ title, segment })} className="flex-1 py-4 bg-accent-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow-blue">Transmitir Agora</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationModal;
