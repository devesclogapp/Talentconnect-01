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
        className="flex items-center gap-3 p-3.5 rounded-[10px] border transition-all duration-[120ms] cursor-pointer group active:scale-[0.99]"
        style={{
            background: 'transparent',
            borderColor: 'rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
    >
        <div className="w-10 h-10 rounded-[10px] bg-bg-primary border border-border-subtle flex items-center justify-center relative shadow-sm shrink-0">
            <Activity className="text-accent-primary" size={18} />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-bg-secondary">
                {count}
            </div>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <h5 className="text-[13px] font-semibold text-text-primary truncate">{title}</h5>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 ${priority === 'Alta' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                    }`}>{priority}</span>
            </div>
            <p className="text-[11px] text-text-secondary truncate">{desc}</p>
            <div className="flex items-center gap-1 mt-0.5">
                <Clock size={9} className="text-accent-primary" />
                <span className="text-[11px] font-bold text-accent-primary uppercase tracking-wide">SLA: {sla}</span>
            </div>
        </div>
        <button className="shrink-0 px-3 py-1.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wide border transition-all duration-[120ms] hover:bg-accent-primary hover:text-white hover:border-accent-primary"
            style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
            {action}
        </button>
    </div>
);

export default InboxItem;
