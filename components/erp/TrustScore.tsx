import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface TrustScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

const TrustScore: React.FC<TrustScoreProps> = ({ score, size = 'md', showLabel = true }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreBg = (s: number) => {
        if (s >= 80) return 'bg-green-500/10';
        if (s >= 50) return 'bg-yellow-500/10';
        return 'bg-red-500/10';
    };

    const getIcon = (s: number, iconSize: number) => {
        if (s >= 80) return <ShieldCheck size={iconSize} className="text-green-500" />;
        if (s >= 50) return <Shield size={iconSize} className="text-yellow-500" />;
        return <ShieldAlert size={iconSize} className="text-red-500" />;
    };

    const getLabel = (s: number) => {
        if (s >= 80) return 'Confiável';
        if (s >= 50) return 'Atenção';
        return 'Alto Risco';
    };

    const dimensions = {
        sm: { icon: 12, text: 'text-xs', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
        md: { icon: 14, text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1.5' },
        lg: { icon: 18, text: 'text-xs', padding: 'px-3 py-1.5', gap: 'gap-2' },
    }[size];

    return (
        <div className={`inline-flex items-center ${dimensions.gap} ${dimensions.padding} ${getScoreBg(score)} rounded-full border border-border/50`}>
            {getIcon(score, dimensions.icon)}
            {showLabel && (
                <div className="flex flex-col leading-none">
                    <span className={`${dimensions.text} font-bold ${getScoreColor(score)} tracking-widest`}>
                        {getLabel(score)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">
                        Confiança: {score}/100
                    </span>
                </div>
            )}
            {!showLabel && (
                <span className={`${dimensions.text} font-bold ${getScoreColor(score)} font-mono`}>
                    {score}
                </span>
            )}
        </div>
    );
};

export default TrustScore;
