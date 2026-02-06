import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'dark' | 'glass';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-brand-secondary shadow-card border border-gray-100', // Standard White Card
            dark: 'bg-gray-800 text-brand-secondary border-none', // Featured/Wallet
            glass: 'bg-brand-secondary/80 backdrop-blur-md shadow-card border border-white/20', // Glassmorphism
        };

        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-lg p-4 transition-all', // rounded-lg maps to 16px in our config
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

export { Card };
