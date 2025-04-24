// src/components/Label.tsx
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    // htmlFor is included in LabelHTMLAttributes
    className?: string;
}

const Label: React.FC<LabelProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <label className={className} {...props}>
            {children}
        </label>
    );
};

export default Label;