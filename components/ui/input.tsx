import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-[44px] w-full rounded-md bg-folio-bg px-4 py-2 text-md text-folio-text placeholder:text-folio-text-dim/40 focus:outline-none focus:ring-2 focus:ring-folio-accent/20 transition-all border border-folio-border',
                        leftIcon && 'pl-11',
                        rightIcon && 'pr-11',
                        error && 'border-error focus:ring-error/20',
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
