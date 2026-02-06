import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'success' | 'warning' | 'error';
    active?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', active, ...props }, ref) => {
        const variants = {
            default: 'bg-gray-200 text-black',
            outline: 'border border-gray-400 text-black bg-transparent',
            // Success agora é Preto. Usar bg-black/10 gera um cinza claro, texto preto. OK.
            success: 'bg-feedback-success/10 text-feedback-success',
            warning: 'bg-feedback-warning/10 text-feedback-warning',
            error: 'bg-feedback-error/10 text-feedback-error',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center rounded-pill px-4 py-2 text-sm font-medium transition-colors',
                    variants[variant],
                    active && 'bg-brand-primary text-brand-secondary',
                    className
                )}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
