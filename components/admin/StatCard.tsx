import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactElement;
    aging: string;
    color: string;
    bg: string;
    trend: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, aging, color, bg, trend, onClick }) => (
    <div
        onClick={onClick}
        className="border border-border rounded-lg p-5 hover:shadow-md transition-all duration-[120ms] cursor-pointer relative overflow-hidden active:scale-[0.99]"
        style={{
            background: 'hsl(var(--card))',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
    >
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-[10px] opacity-60"
            style={{
                background: color.includes('accent') ? 'linear-gradient(90deg, #ff6b00, #ff8533)'
                    : color.includes('success') ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : color.includes('warning') ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, #ef4444, #f87171)'
            }} />
        <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-[6px] ${bg} ${color}`}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className={`text-sm font-normal px-2 py-0.5 rounded-md capitalize ${trend.includes('Ação') || trend.includes('Urgente')
                    ? 'bg-error/10 text-error'
                    : 'bg-bg-secondary text-text-tertiary'
                    }`}>
                    {trend}
                </span>
                <span className="text-sm font-semibold text-text-tertiary opacity-70">{aging}</span>
            </div>
        </div>
        <p className="text-sm font-normal text-text-secondary capitalize mb-0.5">{label}</p>
        <h3 className="text-xl font-semibold text-text-primary leading-tight tracking-tight">{value}</h3>
        <div className="mt-3 h-px w-full opacity-20" style={{ background: 'currentColor' }} />
    </div>
);

export default StatCard;
