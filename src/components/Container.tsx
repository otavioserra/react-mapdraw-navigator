// src/components/Container.tsx
import React, { forwardRef } from 'react'; // Import forwardRef

// Define possible layout variants (remains the same)
type ContainerVariant =
    | 'default'
    | 'control-bar'
    | 'control-group'
    | 'error-message'
    | 'info-message'
    | 'form-group'
    | 'modal-actions';

// Define the props for the Container component
// Note: ref is handled by forwardRef, not listed directly here
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: ContainerVariant;
    className?: string; // Allow *additional* classes for overrides or specifics
}

// Wrap the component definition with forwardRef
// It receives props as the first argument and ref as the second
const Container = forwardRef<HTMLDivElement, ContainerProps>(({
    children,
    variant = 'default',
    className = '',
    ...props
}, ref
) => {
    let baseClasses = "";

    // Assign base classes based on the variant (switch statement remains the same)
    switch (variant) {
        case 'control-bar':
            baseClasses = "flex justify-between items-center mb-4 p-2 border-b border-gray-300";
            break;
        case 'control-group':
            baseClasses = "flex items-center gap-3";
            break;
        case 'error-message':
            baseClasses = "p-3 my-3 border border-red-500 text-red-700 bg-red-100 rounded";
            break;
        case 'info-message':
            baseClasses = "p-5 text-center text-gray-500";
            break;
        case 'form-group':
            baseClasses = "mb-6";
            break;
        case 'modal-actions':
            baseClasses = "flex items-center justify-end space-x-3 mt-6";
            break;
        case 'default':
        default:
            baseClasses = "";
            break;
    }

    // Combine variant classes with any additional classes passed via props
    const combinedClassName = `${baseClasses} ${className}`.trim();

    return (
        // Assign the forwarded ref to the actual div element
        <div ref={ref} className={combinedClassName} {...props}>
            {children}
        </div>
    );
});

// Optional but recommended: Set a display name for debugging purposes
Container.displayName = 'Container';

export default Container;