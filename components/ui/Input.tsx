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
                        'flex h-[44px] w-full rounded-md bg-gray-100 px-4 py-2 text-md text-black placeholder:text-black focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all',
                        leftIcon && 'pl-11',
                        rightIcon && 'pr-11',
                        error && 'border border-feedback-error focus:ring-feedback-error/20',
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
