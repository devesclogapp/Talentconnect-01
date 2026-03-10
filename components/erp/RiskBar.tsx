import React from 'react';

interface RiskBarProps {
    score: number; // 0-100
    showLabel?: boolean;
}

const RiskBar: React.FC<RiskBarProps> = ({ score, showLabel = true }) => {
    const isHigh = score > 60;
    const isMed = score > 30;
    const color = isHigh ? 'bg-red-500' : isMed ? 'bg-yellow-500' : 'bg-green-500';
    const textColor = isHigh ? 'text-red-500' : isMed ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            {showLabel && (
                <span className={`text-[10px] font-semibold tabular-nums ${textColor}`}>
                    {score}
                </span>
            )}
        </div>
    );
};

export default RiskBar;
