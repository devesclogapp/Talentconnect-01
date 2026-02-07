import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sun, Sunset, Moon, Clock } from 'lucide-react';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface TimePickerProps {
    value?: string;
    onChange: (time: string) => void;
    minTime?: string;
    interval?: number;
    className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    minTime,
    interval = 60, // Changed to 60 for simplification
    className
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const generateTimeSlots = () => {
        const slots = [];
        // Only daytime slots (07:00 to 22:00) for simplification
        for (let i = 7 * 60; i <= 22 * 60; i += interval) {
            const h = Math.floor(i / 60);
            const m = i % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            slots.push(timeStr);
        }
        return slots;
    };

    const slots = generateTimeSlots();
    const filteredSlots = slots.filter(slot => {
        if (!minTime) return true;
        return slot >= minTime;
    });

    const groups = [
        { label: 'Manhã', icon: Sun, range: ['07:00', '12:00'] },
        { label: 'Tarde', icon: Sunset, range: ['12:01', '18:00'] },
        { label: 'Noite', icon: Moon, range: ['18:01', '22:00'] },
    ];

    return (
        <div className={cn("w-full space-y-6", className)}>
            <div className="flex items-center gap-2 px-1">
                <Clock size={16} className="text-black/40" />
                <span className="text-[10px] font-bold text-black opacity-30 uppercase tracking-[0.2em]">Escolha o horário</span>
            </div>

            {groups.map((group) => {
                const groupSlots = filteredSlots.filter(s => s >= group.range[0] && s <= group.range[1]);
                if (groupSlots.length === 0) return null;

                return (
                    <div key={group.label} className="space-y-3">
                        <div className="flex items-center gap-2 px-1 text-black/60">
                            <group.icon size={14} />
                            <span className="text-[11px] font-bold tracking-wide">{group.label}</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x px-1">
                            {groupSlots.map((time) => {
                                const isSelected = value === time;
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => onChange(time)}
                                        className={cn(
                                            "flex-shrink-0 min-w-[70px] py-3.5 rounded-2xl text-[13px] font-bold transition-all snap-start border",
                                            isSelected
                                                ? "bg-primary-green text-black border-primary-green shadow-lg shadow-primary-green/20"
                                                : "bg-white text-black/40 border-neutral-100 hover:border-black/10"
                                        )}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {filteredSlots.length === 0 && (
                <div className="p-8 rounded-3xl border-2 border-dashed border-neutral-100 text-center">
                    <p className="text-xs text-black/40 font-bold uppercase tracking-wider">Nenhum horário disponível para hoje</p>
                </div>
            )}
        </div>
    );
};
