import React, { useState, useRef, useEffect } from 'react';
import { User, Briefcase, Package, Coins, Calendar, AlertTriangle, ExternalLink, Info, Sparkles } from 'lucide-react';
import TrustScore from './TrustScore';
import { formatNumber } from '../../utils/format';

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
            case 'CLIENTE': return 'bg-info/10 text-info border-info/20';
            case 'PROFISSIONAL': return 'bg-folio-accent/10 text-folio-accent border-folio-accent/20';
            case 'SERVICO': return 'bg-accent/10 text-accent border-accent/20';
            case 'PEDIDO': return 'bg-success/10 text-success border-success/20';
            case 'NEGOCIACAO': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
            case 'VALOR': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
            case 'RISCO': return 'bg-error/10 text-error border-error/20';
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
                    className="absolute bottom-full left-0 mb-3 z-[100] w-72 bg-folio-surface border border-folio-border rounded-[24px] shadow-folio p-5 animate-fade-in"
                >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-folio-border/50">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${getColorClass().split(' ').slice(0, 3).join(' ')}`}>
                                {getIcon()}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-folio-text-dim">
                                {type}
                            </span>
                        </div>
                        {id && <span className="text-[10px] font-mono text-folio-text-dim/40 bg-folio-bg px-1.5 py-0.5 rounded border border-folio-border">#{id.slice(0, 6)}</span>}
                    </div>

                    <div className="space-y-4">
                        {type === 'CLIENTE' || type === 'PROFISSIONAL' ? (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-folio-surface2 flex items-center justify-center font-bold text-lg text-folio-text overflow-hidden border border-folio-border shadow-sm">
                                        {data?.avatar_url ? (
                                            <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (data?.displayName || data?.name || label || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-bold text-folio-text leading-tight truncate">{data?.displayName || data?.name || label || 'Usuário'}</p>
                                        <p className="text-[10px] text-folio-text-dim font-medium tracking-tight truncate opacity-60">{data?.email || `ID: ${data?.id?.split('-')[0] || 'N/A'}`}</p>
                                    </div>
                                </div>
                                <TrustScore score={data?.trustScore || 85} size="sm" />
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div className="bg-folio-bg rounded-xl p-2.5 text-center border border-folio-border/50 shadow-inner">
                                        <p className="text-[8px] uppercase font-bold text-folio-text-dim tracking-wider mb-1">Pedidos</p>
                                        <p className="text-xs font-black text-folio-text">{data?.totalOrders || 0}</p>
                                    </div>
                                    <div className="bg-folio-bg rounded-xl p-2.5 text-center border border-folio-border/50 shadow-inner">
                                        <p className="text-[8px] uppercase font-bold text-folio-text-dim tracking-wider mb-1">Disputas</p>
                                        <p className="text-xs font-black text-error">{data?.disputes || 0}</p>
                                    </div>
                                </div>
                            </>
                        ) : type === 'SERVICO' ? (
                            <div className="space-y-3">
                                <p className="text-[13px] font-bold text-folio-text leading-tight">{data?.title || label}</p>
                                <div className="flex justify-between items-center bg-folio-bg p-2.5 rounded-xl border border-folio-border/50">
                                    <span className="text-[9px] font-bold text-folio-text-dim uppercase tracking-wider">Categoria</span>
                                    <span className="text-[10px] font-bold text-accent px-2 py-0.5 rounded-lg border border-accent/20">{data?.category || 'Geral'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-folio-bg rounded-xl p-2.5 border border-folio-border/50 shadow-inner">
                                        <p className="text-[8px] uppercase font-bold text-folio-text-dim mb-1">Preço Médio</p>
                                        <p className="text-[11px] font-black text-folio-text">R$ {formatNumber(data?.avgPrice)}</p>
                                    </div>
                                    <div className="bg-folio-bg rounded-xl p-2.5 border border-folio-border/50 shadow-inner">
                                        <p className="text-[8px] uppercase font-bold text-folio-text-dim mb-1">Taxa Disputa</p>
                                        <p className="text-[11px] font-black text-warning">{data?.disputeRate || '0'}%</p>
                                    </div>
                                </div>
                            </div>
                        ) : type === 'VALOR' ? (
                            <div className="space-y-3">
                                <div className="bg-folio-bg p-4 rounded-2xl border border-folio-border space-y-3 shadow-inner">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-folio-text-dim">
                                        <span className="uppercase tracking-wider">Bruto (Escrow)</span>
                                        <span className="text-folio-text">R$ {formatNumber(data?.totalAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-error/80">
                                        <span className="uppercase tracking-wider">Taxa (10%)</span>
                                        <span>- R$ {formatNumber((data?.totalAmount || 0) * 0.1)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-folio-border flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-[1.5px] text-folio-text">Líquido Prof.</span>
                                        <span className="text-md font-black text-success">R$ {formatNumber((data?.totalAmount || 0) * 0.9)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : type === 'PEDIDO' ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start gap-4 p-1">
                                    <span className="text-[9px] font-bold text-folio-text-dim uppercase tracking-[1.5px] pt-1 shrink-0">Serviço</span>
                                    <span className="text-[11px] font-bold text-folio-text text-right leading-tight">{data?.service?.title || 'Relacionado'}</span>
                                </div>
                                <div className="bg-folio-bg p-3 rounded-xl border border-folio-border flex justify-between items-center shadow-inner">
                                    <span className="text-[9px] font-bold text-folio-text-dim uppercase tracking-wider">Status Geral</span>
                                    <span className="text-[9px] font-black px-2 py-1 bg-success/10 text-success rounded-lg border border-success/20 uppercase tracking-widest">
                                        {data?.status || 'Ativo'}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-folio-border flex justify-between items-end p-1">
                                    <span className="text-[9px] font-bold text-folio-text-dim uppercase tracking-wider">Liquidez Total</span>
                                    <span className="text-[16px] font-black text-folio-text tabular-nums">R$ {formatNumber(data?.total_amount)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[11px] text-folio-text-dim leading-relaxed italic opacity-80 p-1">
                                {data?.description || 'Dados contextuais de inteligência não disponíveis para esta negociação.'}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full mt-5 py-3 bg-folio-bg hover:bg-folio-surface2/50 border border-folio-border rounded-xl text-[9px] font-black uppercase tracking-[2px] text-folio-text-dim transition-all active:scale-95 shadow-sm"
                    >
                        FECHAR
                    </button>
                </div>
            )}
        </div>
    );
};

export default SmartTag;
