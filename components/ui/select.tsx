import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '../../utils';

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[] | { label: string; value: string }[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
    searchable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    label,
    disabled,
    error,
    className,
    searchable = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] mb-2 px-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full bg-white dark:bg-neutral-900 border-2 rounded-[20px] p-4 flex items-center justify-between transition-all outline-none",
                    isOpen ? "border-primary-green ring-4 ring-primary-green/5" : "border-neutral-100 dark:border-neutral-800",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:border-black/10 active:scale-[0.99]",
                    error ? "border-error" : ""
                )}
            >
                <span className={cn(
                    "body-bold truncate font-normal",
                    !selectedOption ? "text-black/30" : "text-black dark:text-white"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={18}
                    className={cn(
                        "text-black/30 transition-transform duration-300",
                        isOpen ? "rotate-180 text-black" : ""
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-neutral-900 border-2 border-neutral-100 dark:border-neutral-800 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 origin-top">
                    {searchable && (
                        <div className="p-3 border-b border-neutral-50 dark:border-neutral-800">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-bg-tertiary rounded-xl p-2 pl-9 text-xs outline-none border-none focus:ring-1 ring-primary-green/20"
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-[250px] overflow-y-auto hide-scrollbar p-2 space-y-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors",
                                        value === opt.value
                                            ? "bg-primary-green/10 text-black"
                                            : "hover:bg-bg-tertiary text-black/70 hover:text-black"
                                    )}
                                >
                                    <span className="text-[13px] font-bold">{opt.label}</span>
                                    {value === opt.value && <Check size={14} className="text-primary-green" />}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-black/40 italic">
                                Nenhum resultado encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="text-[10px] text-error font-normal mt-1 px-1">{error}</p>}
        </div>
    );
};
