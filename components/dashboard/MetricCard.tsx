import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    description: string;
    trend?: string;
    variant?: 'primary' | 'secondary' | 'glass';
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon: Icon,
    description,
    trend,
    variant = 'secondary'
}) => {
    const isPrimary = variant === 'primary';

    return (
        <div className={`relative group overflow-hidden p-6 rounded-[32px] border transition-all duration-300 hover:shadow-glow-sm ${isPrimary
                ? 'bg-text-primary border-text-primary text-white'
                : 'bg-bg-primary border-border-subtle text-text-primary hover:bg-bg-secondary'
            }`}>
            {/* Background elements */}
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl transition-colors ${isPrimary ? 'bg-white/10 group-hover:bg-accent-primary/20' : 'bg-bg-secondary group-hover:bg-accent-primary/5'
                }`} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isPrimary ? 'text-white/60' : 'text-text-tertiary'
                        }`}>
                        {label}
                    </p>
                    <Icon size={16} className={isPrimary ? 'text-white/40 group-hover:text-accent-primary' : 'text-text-tertiary group-hover:text-accent-primary'} />
                </div>

                <h5 className={`text-3xl font-black mb-1 flex items-baseline gap-0.5 tracking-tight ${isPrimary ? 'text-white' : 'text-text-primary'
                    }`}>
                    {value}
                    {trend && <span className="text-accent-primary animate-pulse">{trend}</span>}
                </h5>

                <p className={`text-[11px] font-medium leading-tight ${isPrimary ? 'text-white/50' : 'text-text-tertiary'
                    }`}>
                    {description}
                </p>
            </div>
        </div>
    );
};

export default MetricCard;
