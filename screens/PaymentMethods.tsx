import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Wallet, Landmark, ChevronRight, Check, AlertCircle, Info, MoreVertical } from 'lucide-react';
import { useAppStore } from '../store';

interface Props {
    onBack: () => void;
}

const PaymentMethods: React.FC<Props> = ({ onBack }) => {
    const { user } = useAppStore();
    const isProvider = user?.role === 'provider';
    const [activeTab, setActiveTab] = useState<'cards' | 'wallet'>(isProvider ? 'wallet' : 'cards');

    return (
        <div className="min-h-screen bg-bg-primary animate-fade-in pb-20">
            <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-text-primary leading-tight">Pagamentos</h1>
                    <p className="text-[11px] text-text-tertiary font-normal">
                        {isProvider ? 'Carteira e Gestão de Recebíveis' : 'Cartões e Formas de Pagamento'}
                    </p>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto space-y-8">
                {/* Balance Card (Dynamic based on role) */}
                <div className="relative overflow-hidden bg-bg-secondary/40 border border-border-subtle rounded-[32px] p-8 shadow-glow-subtle">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet size={80} className="text-accent-primary" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2 flex items-center gap-2">
                            Saldo na Plataforma <Info size={12} />
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[14px] font-medium text-text-secondary leading-none">R$</span>
                            <span className="text-4xl font-black text-text-primary tracking-tight">0,00</span>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button className="flex-1 py-3 bg-accent-primary text-bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-blue hover:scale-[1.02] transition-transform">
                                {isProvider ? 'Solicitar Saque' : 'Adicionar Saldo'}
                            </button>
                            <button className="flex-1 py-3 bg-bg-primary border border-border-subtle rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-bg-secondary transition-all">
                                Extrato
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-bg-secondary/30 border border-border-subtle rounded-2xl">
                    <button
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cards' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        Cartões Salvos
                    </button>
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'wallet' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                    >
                        {isProvider ? 'Conta Bancária' : 'Carteira Digital'}
                    </button>
                </div>

                {/* Cards Tab Content */}
                {activeTab === 'cards' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Seus Cartões</h4>
                        </div>

                        {/* Card Component */}
                        <div className="p-5 bg-bg-primary border border-border-subtle rounded-3xl relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="w-12 h-6 bg-text-tertiary/10 rounded overflow-hidden flex items-center justify-center">
                                    <span className="text-[8px] font-black italic text-text-tertiary">VISA</span>
                                </div>
                                <MoreVertical size={16} className="text-text-tertiary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-mono tracking-widest text-text-primary">•••• •••• •••• 4242</p>
                                <div className="flex justify-between items-center text-[9px] text-text-tertiary uppercase font-black tracking-widest">
                                    <span>{user?.name || 'Titular do Cartão'}</span>
                                    <span>12/28</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        </div>

                        <button className="w-full flex items-center justify-center gap-3 p-5 border border-dashed border-border-subtle rounded-3xl hover:border-accent-primary group transition-all">
                            <div className="w-8 h-8 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus size={18} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-accent-primary transition-colors">
                                Adicionar Novo Cartão
                            </span>
                        </button>
                    </div>
                )}

                {/* Wallet Tab Content */}
                {activeTab === 'wallet' && (
                    <div className="space-y-6 animate-fade-in">
                        {isProvider ? (
                            <>
                                <h4 className="text-[10px] font-black uppercase text-text-tertiary tracking-widest px-1">Conta para Recebimentos</h4>
                                <div className="p-6 bg-bg-secondary/40 border border-border-subtle rounded-3xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-bg-primary border border-border-subtle flex items-center justify-center text-accent-primary">
                                        <Landmark size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-text-primary">Nubank S.A.</h5>
                                        <p className="text-[10px] text-text-tertiary font-normal tracking-wide">Ag: 0001 • CC: 987654-3</p>
                                    </div>
                                    <button className="text-[9px] font-black uppercase text-accent-primary tracking-widest">Alterar</button>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center bg-bg-secondary/10 border border-border-subtle rounded-3xl border-dashed">
                                <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-success opacity-20" />
                                </div>
                                <h4 className="text-sm font-bold text-text-primary mb-2">Carteira Digital Ativa</h4>
                                <p className="text-[11px] text-text-tertiary leading-relaxed mb-6">
                                    Você pode pagar seus serviços usando o saldo direto da sua carteira Talent Connect.
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-error/5 border border-error/10 rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-error flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-text-tertiary leading-relaxed italic">
                                Por questões de segurança, alterações de dados bancários podem levar até 48 horas para serem validadas pela nossa operadora.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PaymentMethods;
