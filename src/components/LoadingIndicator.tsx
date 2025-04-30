// src/components/LoadingIndicator.tsx
import React from 'react';

const LoadingIndicator: React.FC = () => {
    return (
        // Overlay covers the parent (MapImageViewer container needs position:relative)
        // Centers the spinner/text
        <div className="absolute inset-0 bg-gray-400 bg-opacity-75 flex items-center justify-center z-20 w-full h-full ">
            {/* Simple spinner using Tailwind classes */}
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-700"></div>
        </div>
    );
};

export default LoadingIndicator;