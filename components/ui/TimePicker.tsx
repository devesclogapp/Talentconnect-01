import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Clock } from 'lucide-react';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface TimePickerProps {
    value?: string;
    onChange: (time: string) => void;
    minTime?: string; // "HH:mm" - used if date is today
    interval?: number; // minutes, default 30
    className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    minTime,
    interval = 30,
    className
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 0; i < 24 * 60; i += interval) {
            const h = Math.floor(i / 60);
            const m = i % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            slots.push(timeStr);
        }
        return slots;
    };

    const slots = generateTimeSlots();

    // Filter slots based on minTime
    const filteredSlots = slots.filter(slot => {
        if (!minTime) return true;
        return slot >= minTime;
    });

    // Auto-scroll to selected time
    useEffect(() => {
        if (value && scrollRef.current) {
            const selectedEl = scrollRef.current.querySelector(`[data-time="${value}"]`);
            if (selectedEl) {
                selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [value]);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center gap-2 mb-3 px-1">
                <Clock size={16} className="text-black" />
                <span className="text-xs font-bold text-black uppercase tracking-widest">Horários Disponíveis</span>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {filteredSlots.length > 0 ? (
                    filteredSlots.map((time) => {
                        const isSelected = value === time;
                        return (
                            <button
                                key={time}
                                data-time={time}
                                type="button"
                                onClick={() => onChange(time)}
                                className={cn(
                                    "flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-bold transition-all snap-center border-2",
                                    isSelected
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg shadow-black/20 scale-105"
                                        : "bg-white dark:bg-neutral-900 text-black dark:text-white border-neutral-100 dark:border-neutral-800"
                                )}
                            >
                                {time}
                            </button>
                        );
                    })
                ) : (
                    <div className="text-sm text-black py-3 italic">
                        Nenhum horário disponível
                    </div>
                )}
            </div>
        </div>
    );
};
