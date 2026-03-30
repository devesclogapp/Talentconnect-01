import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from "../ui/tooltip";

interface KpiCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    bg?: string;
    trend?: string;
    trendDir?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    tooltip?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color = 'text-folio-text', bg = 'bg-folio-surface2', trend, trendDir, onClick, tooltip }) => {
    const trendColor = trendDir === 'up' ? 'text-success' : trendDir === 'down' ? 'text-error' : 'text-folio-text-dim';

    return (
        <div
            onClick={onClick}
            className={`group relative bg-folio-surface border border-folio-border rounded-[32px] p-6 transition-all duration-300 shadow-folio hover:shadow-glow-dim hover:-translate-y-1 h-full ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        >
            {/* Tooltip Icon Trigger */}
            {tooltip && (
                <div className="absolute top-4 right-4 z-20" onClick={e => e.stopPropagation()}>
                    <TooltipProvider>
                        <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                                <button className="p-1.5 rounded-full hover:bg-slate-500/5 transition-colors text-slate-400/20 hover:text-slate-400/60 outline-none">
                                    <Info size={14} strokeWidth={2} />
                                </button>
                            </TooltipTrigger>
                            <TooltipPortal>
                                <TooltipContent side="top" className="max-w-[200px] text-center bg-slate-950 text-white border-slate-800 py-2 shadow-2xl z-[9999]">
                                    {tooltip}
                                </TooltipContent>
                            </TooltipPortal>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            <div className="flex items-start justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border border-folio-border/50`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-sm font-normal px-3 py-1 rounded-full bg-folio-bg border border-folio-border shadow-inner ${trendColor} capitalize ${tooltip ? 'mr-6' : ''}`}>
                        {trend}
                    </span>
                )}
            </div>

            <p className="text-sm font-normal text-folio-text-dim capitalize mb-2 opacity-60">{label}</p>
            <h3 className={`text-2xl font-black leading-tight tracking-tight font-display ${color}`}>{value}</h3>
        </div>
    );
};

export default KpiCard;
