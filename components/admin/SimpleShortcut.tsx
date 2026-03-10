import React from 'react';

interface SimpleShortcutProps {
    icon: React.ReactElement;
    label: string;
    onClick?: () => void;
}

const SimpleShortcut: React.FC<SimpleShortcutProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[10px] border transition-all duration-[120ms] group active:scale-95 w-full"
        style={{
            background: 'var(--bg-card, #FFFFFF)',
            borderColor: 'rgba(0,0,0,0.06)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
    >
        <div className="text-text-secondary group-hover:text-accent-primary transition-colors duration-[120ms]">
            {icon}
        </div>
        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">{label}</span>
    </button>
);

export default SimpleShortcut;
