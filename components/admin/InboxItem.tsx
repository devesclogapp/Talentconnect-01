import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface InboxItemProps {
    title: string;
    desc: string;
    count: number;
    priority: string;
    sla: string;
    action: string;
    onClick?: () => void;
}

const InboxItem: React.FC<InboxItemProps> = ({ title, desc, count, priority, sla, action, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-center gap-4 p-5 rounded-3xl border border-folio-border bg-folio-bg hover:bg-folio-surface2/50 transition-all duration-300 cursor-pointer group active:scale-[0.98] shadow-sm hover:shadow-glow-dim"
    >
        <div className="w-12 h-12 rounded-2xl bg-folio-surface border border-folio-border flex items-center justify-center relative shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Activity className="text-folio-accent" size={20} />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E24B4A] text-white text-[11px] font-black flex items-center justify-center rounded-xl border-2 border-folio-bg shadow-lg">
                {count}
            </div>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
                <h5 className="text-[14px] font-bold text-folio-text truncate">{title}</h5>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-[1.5px] shrink-0 ${priority === 'Alta' ? 'bg-[#E24B4A]/10 text-[#E24B4A] border-[#E24B4A]/20' : 'bg-[#F5C842]/10 text-[#F5C842] border-[#F5C842]/20'
                    }`}>{priority}</span>
            </div>
            <p className="text-[11px] text-folio-text-dim/70 truncate font-medium">{desc}</p>
            <div className="flex items-center gap-2 mt-2">
                <Clock size={11} className="text-folio-accent opacity-50" />
                <span className="text-[9px] font-bold text-folio-accent uppercase tracking-widest">SLA: {sla}</span>
            </div>
        </div>
        <button className="shrink-0 px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-[1.5px] border border-folio-border bg-folio-surface text-folio-text-dim hover:bg-folio-accent hover:text-white hover:border-folio-accent transition-all duration-300 shadow-sm">
            {action}
        </button>
    </div>
);

export default InboxItem;
