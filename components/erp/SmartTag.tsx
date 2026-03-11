import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Package, Coins, Calendar, AlertTriangle, ExternalLink, Info, Sparkles } from 'lucide-react';
import TrustScore from './TrustScore';

interface SmartTagProps {
    type: 'CLIENTE' | 'PROFISSIONAL' | 'SERVICO' | 'PEDIDO' | 'NEGOCIACAO' | 'VALOR' | 'DATA' | 'RISCO';
    id?: string;
    label?: string;
    data?: any; // Contextual data to show in popover
    onClick?: () => void;
}

const SmartTag: React.FC<SmartTagProps> = ({ type, id, label, data, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getIcon = () => {
        switch (type) {
            case 'CLIENTE': return <User size={10} />;
            case 'PROFISSIONAL': return <Briefcase size={10} />;
            case 'SERVICO': return <Sparkles size={10} />;
            case 'PEDIDO': return <Package size={10} />;
            case 'NEGOCIACAO': return <ExternalLink size={10} />;
            case 'VALOR': return <Coins size={10} />;
            case 'DATA': return <Calendar size={10} />;
            case 'RISCO': return <AlertTriangle size={10} />;
            default: return <Info size={10} />;
        }
    };

    const getColorClass = () => {
        switch (type) {
            case 'CLIENTE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'PROFISSIONAL': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'SERVICO': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'PEDIDO': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'NEGOCIACAO': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
            case 'VALOR': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
            case 'RISCO': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                    if (onClick) onClick();
                }}
                className={`
                    inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider
                    transition-all active:scale-95 whitespace-nowrap
                    ${getColorClass()}
                `}
            >
                {getIcon()}
                {label || `#${type}${id ? `:${id.slice(0, 4)}` : ''}`}
            </button>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute bottom-full left-0 mb-2 z-[100] w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2"
                >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${getColorClass().split(' ').slice(0, 2).join(' ')}`}>
                                {getIcon()}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {type}
                            </span>
                        </div>
                        {id && <span className="text-[9px] font-mono text-muted-foreground">#{id.slice(0, 8)}</span>}
                    </div>

                    <div className="space-y-3">
                        {type === 'CLIENTE' || type === 'PROFISSIONAL' ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-lg text-foreground overflow-hidden border border-border">
                                        {data?.avatar_url ? (
                                            <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (data?.displayName || data?.name || label || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground leading-tight truncate">{data?.displayName || data?.name || label || 'Usuário'}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">{data?.email || `ID: ${data?.id?.split('-')[0] || 'N/A'}`}</p>
                                    </div>
                                </div>
                                <TrustScore score={data?.trustScore || 85} size="sm" />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-muted/30 rounded-lg p-2 text-center border border-border/50">
                                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Pedidos</p>
                                        <p className="text-xs font-bold">{data?.totalOrders || 0}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-2 text-center border border-border/50">
                                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Disputas</p>
                                        <p className="text-xs font-bold text-red-500">{data?.disputes || 0}</p>
                                    </div>
                                </div>
                            </>
                        ) : type === 'SERVICO' ? (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-foreground leading-tight">{data?.title || label}</p>
                                <div className="flex justify-between items-center bg-muted/40 p-2 rounded-lg border border-border/50">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Categoria</span>
                                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">{data?.category || 'Geral'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/50">
                                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Preço Médio</p>
                                        <p className="text-[10px] font-bold">R$ {data?.avgPrice?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/50">
                                        <p className="text-[8px] uppercase font-bold text-muted-foreground">Taxa Disputa</p>
                                        <p className="text-[10px] font-bold text-orange-500">{data?.disputeRate || '0'}%</p>
                                    </div>
                                </div>
                            </div>
                        ) : type === 'VALOR' ? (
                            <div className="space-y-2">
                                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground">
                                        <span>Valor Bruto (Escrow)</span>
                                        <span className="font-bold text-foreground">R$ {(data?.totalAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-medium text-red-500/80">
                                        <span>Taxa Plattform (15%)</span>
                                        <span className="font-bold">- R$ {((data?.totalAmount || 0) * 0.15).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-border flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Repasse Profissional</span>
                                        <span className="text-sm font-black text-green-500">R$ {((data?.totalAmount || 0) * 0.85).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : type === 'PEDIDO' ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pt-1">Serviço</span>
                                    <span className="text-xs font-bold text-foreground text-right">{data?.service?.title || 'Relacionado'}</span>
                                </div>
                                <div className="bg-muted/30 p-2 rounded-lg border border-border/50 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Status Global</span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded-md uppercase tracking-wider">
                                        {data?.status || 'Ativo'}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Valor Total</span>
                                    <span className="text-xs font-black text-foreground">R$ {data?.total_amount?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-muted-foreground leading-relaxed italic">
                                {data?.description || 'Dados contextuais de inteligência não disponíveis para esta negociação.'}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-colors"
                    >
                        Fechar Painel
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmartTag;
