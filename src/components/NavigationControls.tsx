import React from 'react';

interface NavigationControlsProps {
    onBack: () => void;
    isBackEnabled: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
    onBack,
    isBackEnabled,
}) => {
    // Basic styling for the controls container and button
    // TODO: Refine styling as needed
    const controlsStyle: React.CSSProperties = {
        padding: '10px',
        borderBottom: '1px solid #ccc',
        marginBottom: '10px',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '8px 15px',
        cursor: 'pointer',
    };

    const disabledButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        cursor: 'not-allowed',
        opacity: 0.5,
    };

    return (
        <div style={controlsStyle}>
            <button
                onClick={onBack}
                disabled={!isBackEnabled}
                style={isBackEnabled ? buttonStyle : disabledButtonStyle}
            >
                Back
            </button>
            {/* TODO: Add other controls if needed (e.g., Home, Zoom) */}
        </div>
    );
};

export default NavigationControls;
