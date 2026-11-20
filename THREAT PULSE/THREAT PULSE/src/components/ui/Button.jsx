import React from 'react';
import { cn } from '../../lib/utils';

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const variants = {
    default: "bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-semibold hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    outline: "border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "hover:bg-gray-800/60 text-gray-300 hover:text-white"
  };

  const sizes = {
    default: "px-4 py-2 text-sm rounded-lg",
    sm: "px-3 py-1.5 text-xs rounded-md",
    lg: "px-6 py-3 text-base rounded-xl"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
