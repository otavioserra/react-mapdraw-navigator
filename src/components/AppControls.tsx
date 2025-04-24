// src/components/AppControls.tsx
import React from 'react';

// Define the props required by the controls component
interface AppControlsProps {
    onBack: () => void; // Function to handle back navigation
    canGoBack: boolean; // State indicating if back navigation is possible
    isEditMode: boolean; // State indicating if edit mode is active
    onToggleEditMode: () => void; // Function to toggle edit mode
    onExportJson: () => void; // Function to handle JSON export
}

// Basic button styling (Consider consolidating or using Tailwind variants)
const baseButtonStyle: React.CSSProperties = {
    padding: '5px 10px', cursor: 'pointer',
    border: '1px solid #ccc', borderRadius: '4px',
    whiteSpace: 'nowrap'
};

const disabledButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    cursor: 'not-allowed',
    opacity: 0.5,
};

const AppControls: React.FC<AppControlsProps> = ({
    onBack,
    canGoBack,
    isEditMode,
    onToggleEditMode,
    onExportJson,
}) => {
    // Determine if the back button should be enabled (only if canGoBack is true AND not in edit mode)
    const isBackEnabled = canGoBack && !isEditMode;

    return (
        // Container for all controls, using Tailwind for layout
        <div className="flex justify-between items-center mb-4 p-2 border-b border-gray-300">

            {/* Back Button */}
            <div> {/* Wrap Back button for potential future additions on the left */}
                <button
                    onClick={onBack}
                    disabled={!isBackEnabled}
                    style={isBackEnabled ? baseButtonStyle : disabledButtonStyle}
                // Example using Tailwind classes (alternative to inline styles)
                // className={`px-3 py-1 rounded border ${
                //  isBackEnabled
                //      ? 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
                //      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                // }`}
                >
                    Back
                </button>
            </div>

            {/* Right-side Controls (Export, Edit Mode) */}
            <div className="flex items-center gap-3"> {/* Use gap for spacing */}
                <button
                    onClick={onExportJson}
                    style={{ ...baseButtonStyle, backgroundColor: '#ddeeff' }}
                // Example Tailwind: className="px-3 py-1 rounded border bg-blue-100 hover:bg-blue-200"
                >
                    Export JSON
                </button>
                <button
                    onClick={onToggleEditMode}
                    style={{ ...baseButtonStyle, backgroundColor: isEditMode ? '#ffdddd' : '#ddffdd' }}
                // Example Tailwind: className={`px-3 py-1 rounded border ${isEditMode ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'}`}
                >
                    {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>
            </div>
        </div>
    );
};

export default AppControls;
