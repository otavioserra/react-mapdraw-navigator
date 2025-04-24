// src/components/AppControls.tsx
import React from 'react';
import Button from './Button';
import Container from './Container';
import { EditAction } from '../hooks/useMapNavigation';

// Prop interface (remains the same structure)
interface AppControlsProps {
    onBack: () => void;
    canGoBack: boolean;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onExportJson: () => void;
    editAction: EditAction; // Declare the current action state prop
    setEditAction: React.Dispatch<React.SetStateAction<EditAction>>; // Declare the setter function prop
    // onInitiateAddHotspot?: () => void; // Placeholder for future prop
    // onInitiateRemoveHotspot?: () => void; // Placeholder for future prop
}

// --- Mini-component for NORMAL mode controls ---
const NormalModeControls: React.FC<Pick<AppControlsProps, 'onExportJson' | 'onToggleEditMode'>> = ({
    onExportJson,
    onToggleEditMode,
}) => (
    <>
        <Button variant="export" onClick={onExportJson}>
            Export JSON
        </Button>
        <Button variant="toggle-off" onClick={onToggleEditMode}>
            Enter Edit Mode
        </Button>
    </>
);

// --- Define specific props needed by EditModeControls ---
interface EditModeControlsProps {
    onToggleEditMode: () => void;
    setEditAction: React.Dispatch<React.SetStateAction<EditAction>>; // Prop for the setter
    editAction: EditAction; // Prop for the current action (useful later)
    // Add other props like onInitiateAddHotspot etc. in the future if needed
}

// --- Mini-component for EDIT mode controls (Updated) ---
const EditModeControls: React.FC<EditModeControlsProps> = ({
    onToggleEditMode,
    setEditAction, // Receive the setter function via props
    editAction,    // Receive the current action via props
}) => (
    <>
        {/* Add Hotspot Button: Set action to 'adding' on click */}
        <Button
            variant="add"
            // You could add conditional styling here later if needed:
            // className={editAction === 'adding' ? 'ring-2 ring-green-500' : ''}
            onClick={() => setEditAction('adding')} // Call the received setter
        >
            Add Hotspot
        </Button>

        {/* Remove Hotspot Button: Set action to 'selecting_for_deletion' on click */}
        <Button
            variant="remove"
            // You could add conditional styling here later if needed:
            // className={editAction === 'selecting_for_deletion' ? 'ring-2 ring-red-500' : ''}
            onClick={() => setEditAction('selecting_for_deletion')} // Call the received setter
        >
            Remove Hotspot
        </Button>

        {/* Exit Edit Mode button remains the same */}
        <Button variant="toggle-on" onClick={onToggleEditMode}>
            Exit Edit Mode
        </Button>
    </>
);


// --- Main AppControls Component ---
const AppControls: React.FC<AppControlsProps> = ({
    onBack,
    canGoBack,
    isEditMode,
    onToggleEditMode,
    onExportJson,
    editAction,
    setEditAction,
}) => {
    // Determine if the back button should be enabled
    const isBackEnabled = canGoBack && !isEditMode;

    return (
        // Use Container variant for the main control bar layout
        <Container variant="control-bar">

            {/* Back Button (using default container variant) */}
            <Container variant="default"> {/* Or simply <Container> */}
                <Button variant="back" onClick={onBack} disabled={!isBackEnabled}>
                    Back
                </Button>
            </Container>

            {/* Right-side Controls (using control-group variant) */}
            <Container variant="control-group">
                {isEditMode
                    ? <EditModeControls
                        onToggleEditMode={onToggleEditMode}
                        setEditAction={setEditAction}
                        editAction={editAction}
                    />
                    : <NormalModeControls
                        onExportJson={onExportJson}
                        onToggleEditMode={onToggleEditMode}
                    />
                }
            </Container>

        </Container>
    );
};

export default AppControls;