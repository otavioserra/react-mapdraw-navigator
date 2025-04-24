// src/components/Footer.tsx
import React from 'react';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    className?: string;
}

const Footer: React.FC<FooterProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <footer className={className} {...props}>
            {children}
        </footer>
    );
};

export default Footer;