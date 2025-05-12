// src/components/Button.tsx
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useMapInstanceContext } from '../contexts/MapInstanceContext';

// Defines the style variants our button can have
type ButtonVariant = 'default' | 'primary' | 'add' | 'remove' | 'toggle-on' | 'toggle-off' | 'export' | 'back' | 'disabled' | 'no-variant';

// Defines the props for the Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // onClick is already included in React.ButtonHTMLAttributes
    // disabled is already included
    children: React.ReactNode;
    variant?: ButtonVariant; // Optional variant for styling
    className?: string; // Allow additional Tailwind classes
    tooltipContent?: React.ReactNode; // Optional tooltip content
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    disabled,
    variant = 'default', // Default if no variant is provided
    className = '', // Allows custom classes
    tooltipContent, // Optional tooltip content
    ...props // Pass down other native button props (like 'type')
}) => {
    const { rootContainerElement } = useMapInstanceContext();
    // --- Style Logic Based on Variant (Tailwind Example) ---
    // Adapt this if using inline styles or CSS Modules

    let baseClasses = "px-1.5 py-1.5 rounded border font-medium text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center justify-center"; // Adjusted base padding, added flex for icon centering
    let variantClasses = "";

    switch (variant) {
        case 'no-variant': variantClasses = ""; break;
        case 'primary': variantClasses = "cursor-pointer bg-blue-500 hover:bg-blue-600 border-blue-600 text-white focus:ring-blue-500"; break;
        case 'add': variantClasses = "cursor-pointer bg-green-100 hover:bg-green-200 border-green-300 text-green-800 focus:ring-green-500"; break;
        case 'remove': variantClasses = "cursor-pointer bg-red-100 hover:bg-red-200 border-red-300 text-red-800 focus:ring-red-500"; break;
        case 'toggle-on': variantClasses = "cursor-pointer bg-red-100 hover:bg-red-200 border-red-300 text-red-800 focus:ring-red-500"; break;
        case 'toggle-off': variantClasses = "cursor-pointer bg-green-100 hover:bg-green-200 border-green-300 text-green-800 focus:ring-green-500"; break;
        case 'export': variantClasses = "cursor-pointer bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800 focus:ring-blue-500"; break;
        case 'back': variantClasses = "cursor-pointer bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-800 focus:ring-gray-500"; break;
        case 'disabled':
            baseClasses += " cursor-not-allowed opacity-50";
            variantClasses = "bg-gray-200 border-gray-300 text-gray-400";
            break;
        default: variantClasses = "cursor-pointer bg-white hover:bg-gray-100 border-gray-300 text-gray-800 focus:ring-gray-500"; break;
    }
    if (disabled) {
        baseClasses = "px-1.5 py-1.5 rounded border font-medium text-xs cursor-not-allowed opacity-50 flex items-center justify-center";
        variantClasses = "bg-gray-200 border-gray-300 text-gray-400";
    }

    const buttonElement = (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses} ${className}`}
            {...props}
        >
            {children} {/* This will be the SVG icon */}
        </button>
    );

    // Conditionally wrap with Tooltip components if tooltipContent is provided
    if (tooltipContent) {
        return (
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    {buttonElement}
                </Tooltip.Trigger>
                <Tooltip.Portal container={rootContainerElement || undefined}>
                    <Tooltip.Content
                        className="text-xs bg-gray-900 text-white rounded px-2 py-1 shadow-md select-none z-50" // Added higher z-index
                        sideOffset={5}
                        align="center"
                    >
                        {tooltipContent} {/* Display the content passed in the prop */}
                        <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        );
    }

    // If no tooltipContent, just return the button
    return buttonElement;
};

export default Button;