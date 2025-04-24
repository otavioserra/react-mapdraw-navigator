// src/components/Form.tsx
import React from 'react';

// Define props, including standard form attributes like onSubmit
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    children: React.ReactNode;
    // onSubmit is included in FormHTMLAttributes
    className?: string;
}

const Form: React.FC<FormProps> = ({
    children,
    className = '',
    onSubmit, // Explicitly mention onSubmit for clarity, though included in props
    ...props // Pass down other standard form attributes (like 'id', 'method', 'action' if needed)
}) => {
    return (
        <form
            className={className}
            onSubmit={onSubmit} // Pass the onSubmit handler
            {...props}
        >
            {children}
        </form>
    );
};

export default Form;