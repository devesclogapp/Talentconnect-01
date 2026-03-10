import React from 'react';

interface KpiCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    bg?: string;
    trend?: string;
    trendDir?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color = 'text-foreground', bg = 'bg-muted', trend, trendDir, onClick }) => {
    const trendColor = trendDir === 'up' ? 'text-green-500' : trendDir === 'down' ? 'text-red-500' : 'text-muted-foreground';

    return (
        <div
            onClick={onClick}
            className={`group relative bg-card border border-border rounded-xl p-5 transition-all duration-150 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/30 active:scale-[0.99]' : ''}`}
        >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 w-full h-0.5 ${bg} opacity-70`} />

            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${bg} ${color} transition-transform duration-150 group-hover:scale-105`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted ${trendColor} uppercase tracking-wide`}>
                        {trend}
                    </span>
                )}
            </div>

            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <h3 className={`text-2xl font-semibold leading-none ${color}`}>{value}</h3>
        </div>
    );
};

export default KpiCard;
