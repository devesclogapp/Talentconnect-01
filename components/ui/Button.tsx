import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const variants = {
            primary: 'bg-black text-white dark:bg-white dark:text-black active:scale-[0.97] shadow-lg shadow-black/20',
            secondary: 'bg-gray-200 text-black dark:bg-neutral-800 dark:text-white active:scale-[0.97]',
            ghost: 'bg-transparent text-black dark:text-white active:scale-[0.97]',
            outline: 'border border-gray-200 dark:border-neutral-800 bg-transparent text-black dark:text-white active:scale-[0.97]'
        };

        const sizes = {
            default: 'h-[48px] px-6 text-md rounded-xl',
            sm: 'h-[36px] px-4 text-sm rounded-lg',
            lg: 'h-[56px] px-8 text-lg rounded-2xl',
            icon: 'h-[48px] w-[48px] p-0 rounded-full', // Circular for icons
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button, cn };
