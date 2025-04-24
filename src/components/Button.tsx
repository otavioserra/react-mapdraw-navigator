// src/components/Button.tsx
import React from 'react';

// Defines the style variants our button can have
type ButtonVariant = 'default' | 'primary' | 'add' | 'remove' | 'toggle-on' | 'toggle-off' | 'export' | 'back' | 'disabled';

// Defines the props for the Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // onClick is already included in React.ButtonHTMLAttributes
    // disabled is already included
    children: React.ReactNode;
    variant?: ButtonVariant; // Optional variant for styling
    className?: string; // Allow additional Tailwind classes
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    disabled,
    variant = 'default', // Default if no variant is provided
    className = '', // Allows custom classes
    ...props // Pass down other native button props (like 'type')
}) => {

    // --- Style Logic Based on Variant (Tailwind Example) ---
    // Adapt this if using inline styles or CSS Modules

    let baseClasses = "px-3 py-1 rounded border font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50"; // Common base styles
    let variantClasses = "";

    switch (variant) {
        case 'primary':
            variantClasses = "bg-blue-500 hover:bg-blue-600 border-blue-600 text-white focus:ring-blue-500";
            break;
        case 'add':
            variantClasses = "bg-green-100 hover:bg-green-200 border-green-300 text-green-800 focus:ring-green-500";
            break;
        case 'remove':
            variantClasses = "bg-red-100 hover:bg-red-200 border-red-300 text-red-800 focus:ring-red-500";
            break;
        case 'toggle-on': // Example: Edit mode active (red style for 'exit')
            variantClasses = "bg-red-100 hover:bg-red-200 border-red-300 text-red-800 focus:ring-red-500";
            break;
        case 'toggle-off': // Example: Edit mode inactive (green style for 'enter')
            variantClasses = "bg-green-100 hover:bg-green-200 border-green-300 text-green-800 focus:ring-green-500";
            break;
        case 'export':
            variantClasses = "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800 focus:ring-blue-500";
            break;
        case 'back':
            variantClasses = "bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-800 focus:ring-gray-500";
            break;
        case 'disabled': // Specific style when disabled
            baseClasses += " cursor-not-allowed opacity-50";
            // Keep 'back' or 'default' background as base for disabled
            variantClasses = "bg-gray-200 border-gray-300 text-gray-400";
            break;
        default: // 'default' variant
            variantClasses = "bg-white hover:bg-gray-100 border-gray-300 text-gray-800 focus:ring-gray-500";
            break;
    }

    // Apply disabled style if the 'disabled' prop is true, overriding variant if necessary
    const currentVariant = disabled ? 'disabled' : variant;
    if (disabled) {
        // Recalculate classes for the disabled state
        baseClasses = "px-3 py-1 rounded border font-medium cursor-not-allowed opacity-50";
        variantClasses = "bg-gray-200 border-gray-300 text-gray-400"; // Default disabled style
    }


    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses} ${className}`} // Combine all classes
            {...props} // Pass other HTML props (e.g., type="button")
        >
            {children}
        </button>
    );
};

export default Button;