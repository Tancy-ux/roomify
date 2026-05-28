import React, {type ButtonHTMLAttributes} from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
                                         variant = 'primary',
                                         size = 'md',
                                         fullWidth = false,
                                         className = '',
                                         children,
                                         ...props
                                       }) => {
  const baseClass = 'btn';
  const variantClass = `${baseClass}--${variant}`;
  const sizeClass = `${baseClass}--${size}`;
  const fullWidthClass = fullWidth ? `${baseClass}--full-width` : '';

  const combinedClasses = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;

// code rabbit - 35:20 time
