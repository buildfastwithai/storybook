import React from 'react';

// Wait, I don't know if @/lib/utils exists. The package.json has clsx and tailwind-merge.
// I'll implement a local cn or just use clsx/tailwind-merge directly if I can't find utils.
// Checking file structure earlier: src/app/globals.css exists. src/components.json exists.
// Usually shadcn uses @/lib/utils.
// I'll assume I can use clsx and tailwind-merge directly to be safe, or create a utility.
// Let's check if lib/utils exists first? No, I'll just implement it inline or use a simple version.
// Actually, the user provided code didn't have imports for Button, it just used it.
// I'll create a robust Button component.

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-amber-500/20",
    secondary: "bg-stone-700 hover:bg-stone-600 text-stone-200",
    ghost: "hover:bg-white/10 text-stone-300 hover:text-white"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
