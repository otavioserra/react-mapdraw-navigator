// src/components/Container.tsx
import React from 'react';

// Define possible layout variants
// Add more as needed for other parts of your application
type ContainerVariant = 'default' | 'control-bar' | 'control-group';

// Define the props for the Container component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: ContainerVariant; // Variant to determine layout classes
    className?: string; // Allow *additional* classes for overrides or specifics
}

const Container: React.FC<ContainerProps> = ({
    children,
    variant = 'default', // Default variant if none is provided
    className = '', // For additional, specific classes
    ...props // Pass down other standard div attributes (like style, id, etc.)
}) => {
    let baseClasses = ""; // Base classes determined by variant

    // Assign base classes based on the variant
    switch (variant) {
        case 'control-bar':
            // Layout for the main controls row: flex, space-between, items-center, padding, border etc.
            baseClasses = "flex justify-between items-center mb-4 p-2 border-b border-gray-300";
            break;
        case 'control-group':
            // Layout for grouping buttons together: flex, items-center, gap
            baseClasses = "flex items-center gap-3";
            break;
        case 'default':
        default:
            // Default container, maybe just a block or inline-block, no specific flex/padding
            // If you often wrap single items, 'inline-block' might be useful, otherwise just empty
            baseClasses = ""; // Or 'block', 'inline-block' if needed as a default wrapper style
            break;
    }

    // Combine variant classes with any additional classes passed via props
    const combinedClassName = `${baseClasses} ${className}`.trim();

    return (
        <div className={combinedClassName} {...props}>
            {children}
        </div>
    );
};

export default Container;