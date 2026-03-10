import React from 'react';
import { X, Lock } from 'lucide-react';

interface RiskActionModalProps {
    user: any;
    reason: string;
    onReasonChange: (reason: string) => void;
    onClose: () => void;
    onAction: (action: string) => void;
}

const RiskActionModal: React.FC<RiskActionModalProps> = ({ user, reason, onReasonChange, onClose, onAction }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
        <div className="bg-bg-primary w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-error/20 animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-border-subtle bg-error/5">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-error text-white rounded-2xl shadow-glow-red">
                        <Lock size={32} />
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-secondary rounded-xl transition-all"><X size={24} /></button>
                </div>
                <h2 className="text-2xl font-black text-text-primary mb-2">Protocolo de Bloqueio</h2>
                <p className="text-[11px] text-text-tertiary">Você está prestes a restringir permanentemente o acesso de <strong>{user?.user}</strong>.</p>
            </div>
            <div className="p-10 space-y-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-text-tertiary uppercase tracking-widest">Justificativa da Auditoria (Obrigatório)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        className="w-full h-32 bg-bg-secondary border border-border-subtle rounded-2xl p-4 text-[13px] font-medium outline-none focus:border-error transition-all"
                        placeholder="Ex: Padrão de fraude detectado no IP..."
                    />
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-bg-secondary rounded-2xl text-[11px] font-black uppercase tracking-widest">Cancelar</button>
                    <button onClick={() => onAction('BLOCK_USER')} className="flex-1 py-4 bg-error text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow-red">Confirmar Bloqueio</button>
                </div>
            </div>
        </div>
    </div>
);

export default RiskActionModal;
