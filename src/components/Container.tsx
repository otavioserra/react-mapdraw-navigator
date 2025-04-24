// src/components/Container.tsx
import React from 'react';

// Define possible layout variants
type ContainerVariant =
    | 'default'
    | 'control-bar'
    | 'control-group'
    | 'error-message'  // New
    | 'info-message'   // New
    | 'form-group'     // New
    | 'modal-actions'; // New

// Define the props for the Container component
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: ContainerVariant;
    className?: string; // Allow *additional* classes for overrides or specifics
}

const Container: React.FC<ContainerProps> = ({
    children,
    variant = 'default',
    className = '',
    ...props
}) => {
    let baseClasses = "";

    // Assign base classes based on the variant
    switch (variant) {
        case 'control-bar':
            baseClasses = "flex justify-between items-center mb-4 p-2 border-b border-gray-300";
            break;
        case 'control-group':
            baseClasses = "flex items-center gap-3";
            break;
        case 'error-message': // Styling for error boxes
            baseClasses = "p-3 my-3 border border-red-500 text-red-700 bg-red-100 rounded";
            break;
        case 'info-message': // Styling for info/loading messages
            baseClasses = "p-5 text-center text-gray-500";
            break;
        case 'form-group': // Standard margin below form groups
            baseClasses = "mb-6"; // Adjusted from mb-4/mb-6 in original modal
            break;
        case 'modal-actions': // Layout for modal action buttons
            baseClasses = "flex items-center justify-end space-x-3 mt-6";
            break;
        case 'default':
        default:
            baseClasses = ""; // No base classes for default
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