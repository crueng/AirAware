import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './CustomButton.css';

interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string; 
}

export default function CustomButton({ children, className = '', ...props }: CustomButtonProps) {
  return (
    <button 
      className={`custom-btn ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}