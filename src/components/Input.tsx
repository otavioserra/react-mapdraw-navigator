// src/components/Input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // Common input attributes (value, onChange, type, placeholder, etc.) are included
    className?: string;
}

const Input: React.FC<InputProps> = ({
    className = '',
    type = 'text', // Default type to text
    ...props
}) => {
    return (
        <input
            type={type}
            className={className}
            {...props}
        />
    );
};

export default Input;