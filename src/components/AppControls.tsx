// src/components/AppControls.tsx
import React from 'react';
import Button from './Button';
import Container from './Container';
import { EditAction } from '../hooks/useMapNavigation';

interface AppControlsProps {
    onBack: () => void;
    canGoBack: boolean;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onExportJson: () => void;
    editAction: EditAction;
    setEditAction: React.Dispatch<React.SetStateAction<EditAction>>;
    onJsonFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetTransform?: () => void;
}

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

// Define specific props needed by EditModeControls
interface EditModeControlsProps {
    onToggleEditMode: () => void;
    setEditAction: React.Dispatch<React.SetStateAction<EditAction>>;
    editAction: EditAction;
}

// Mini-component for EDIT mode controls
const EditModeControls: React.FC<EditModeControlsProps> = ({
    onToggleEditMode,
    setEditAction,
    editAction,
}) => (
    <>
        <Button
            variant="add"
            className={editAction === 'adding' ? 'ring-2 ring-green-500' : ''}
            onClick={() => setEditAction('adding')}
        >
            Add Hotspot
        </Button>

        <Button
            variant="remove"
            className={editAction === 'selecting_for_deletion' ? 'ring-2 ring-red-500' : ''}
            onClick={() => setEditAction('selecting_for_deletion')}
        >
            Remove Hotspot
        </Button>

        <Button variant="toggle-on" onClick={onToggleEditMode}>
            Exit Edit Mode
        </Button>
    </>
);

const AppControls: React.FC<AppControlsProps> = ({
    onBack,
    canGoBack,
    isEditMode,
    onToggleEditMode,
    onExportJson,
    editAction,
    setEditAction,
    onJsonFileSelected,
    onZoomIn,
    onZoomOut,
    onResetTransform,
}) => {
    const isBackEnabled = canGoBack && !isEditMode;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Container variant="control-bar">
            <input
                type="file"
                ref={fileInputRef}
                onChange={onJsonFileSelected}
                accept=".json"
                style={{ display: 'none' }}
            />

            <Container variant="default">
                <Button variant="back" onClick={onBack} disabled={!isBackEnabled}>
                    Back
                </Button>
            </Container>

            <Container variant="control-group">
                {onZoomIn && <Button onClick={onZoomIn} variant="default" className="p-1">Zoom In</Button>}
                {onZoomOut && <Button onClick={onZoomOut} variant="default" className="p-1">Zoom Out</Button>}
                {onResetTransform && <Button onClick={onResetTransform} variant="default" className="p-1">Reset</Button>}

                {isEditMode
                    ? <EditModeControls
                        onToggleEditMode={onToggleEditMode}
                        setEditAction={setEditAction}
                        editAction={editAction}
                    />
                    : <>
                        <Button variant="default" onClick={handleImportClick}>
                            Import JSON
                        </Button>
                        <NormalModeControls
                            onExportJson={onExportJson}
                            onToggleEditMode={onToggleEditMode}
                        />
                    </>
                }
            </Container>
        </Container>
    );
};

export default AppControls;