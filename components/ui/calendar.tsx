import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface CalendarProps {
    value?: Date | null;
    onChange: (date: Date) => void;
    minDate?: Date;
    className?: string;
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Calendar: React.FC<CalendarProps> = ({ value, onChange, minDate, className }) => {
    const [viewDate, setViewDate] = useState(value || new Date());

    useEffect(() => {
        if (value) {
            setViewDate(value);
        }
    }, [value]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (d: Date) => {
        return isSameDay(d, new Date());
    };

    const isDisabled = (date: Date) => {
        if (!minDate) return false;
        const compareDate = new Date(date);
        compareDate.setHours(23, 59, 59, 999);
        const minDateStart = new Date(minDate);
        minDateStart.setHours(0, 0, 0, 0);
        return compareDate < minDateStart;
    };

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = value ? isSameDay(date, value) : false;
            const disabled = isDisabled(date);
            const today = isToday(date);

            days.push(
                <button
                    key={day}
                    onClick={() => !disabled && onChange(date)}
                    disabled={disabled}
                    className={cn(
                        "h-10 w-10 text-sm font-medium rounded-full flex items-center justify-center transition-all",
                        isSelected
                            ? "bg-primary-green text-black shadow-lg shadow-primary-green/20 scale-105 font-bold"
                            : "text-black dark:text-white  dark:",
                        disabled && "opacity-20 cursor-not-allowed ",
                        !isSelected && today && "border border-primary-green text-black-green"
                    )}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className={cn("bg-white dark:bg-neutral-900 rounded-[32px] p-6 shadow-sm border border-neutral-100 dark:border-neutral-800", className)}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-black dark:text-white capitalize">
                    {MONTHS[viewDate.getMonth()]} <span className="text-black">{viewDate.getFullYear()}</span>
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-full  dark: text-black dark:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-full  dark: text-black dark:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 mb-2">
                {DAYS.map((day) => (
                    <div key={day} className="h-10 w-10 flex items-center justify-center text-xs font-bold text-black">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {renderDays()}
            </div>
        </div>
    );
};
