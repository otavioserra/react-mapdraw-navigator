// src/components/Heading.tsx
import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    /** The heading level (1 for <h1>, 2 for <h2>, etc.) */
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children: React.ReactNode;
    className?: string;
    // Other standard HTML heading attributes are passed via ...props
}

const Heading: React.FC<HeadingProps> = ({
    level,
    children,
    className = '',
    ...props // Pass down other props like 'id', 'style', etc.
}) => {

    // Use a switch statement to render the correct heading tag
    switch (level) {
        case 1:
            return <h1 className={className} {...props}>{children}</h1>;
        case 2:
            return <h2 className={className} {...props}>{children}</h2>;
        case 3:
            return <h3 className={className} {...props}>{children}</h3>;
        case 4:
            return <h4 className={className} {...props}>{children}</h4>;
        case 5:
            return <h5 className={className} {...props}>{children}</h5>;
        case 6:
            return <h6 className={className} {...props}>{children}</h6>;
        default:
            // Fallback case, though the 'level' prop type should prevent this.
            // Defaulting to h2 seems reasonable.
            console.warn(`Invalid heading level prop received: ${level}. Defaulting to h2.`);
            return <h2 className={className} {...props}>{children}</h2>;
    }
};

export default Heading;