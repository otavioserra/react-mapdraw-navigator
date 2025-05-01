// src/components/AppControls.tsx
import React, { useEffect } from 'react';
import Button from './Button';
import Container from './Container';
import { EditAction } from '../hooks/useMapNavigation';
import Label from './Label';
import Input from './Input';

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
    isAdminEnabled?: boolean;
    isCurrentlyOnRootMap?: boolean;
    onChangeRootImage?: () => void;
    newRootUrlInput?: string;
    onNewRootUrlChange?: (value: string) => void;
    onConfirmChangeRootImage?: () => void;
    onCancelChangeRootImage?: () => void;
    onHeightChange?: (height: number) => void;
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
    isAdminEnabled = false,
    isCurrentlyOnRootMap = false,
    onChangeRootImage,
    newRootUrlInput = '',
    onNewRootUrlChange,
    onConfirmChangeRootImage,
    onCancelChangeRootImage,
    onHeightChange,
}) => {
    const isBackEnabled = canGoBack && !isEditMode;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    const contRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const observedElement = contRef.current;
        if (!observedElement || !onHeightChange) return;

        // Function to call when size changes
        const reportHeight = () => {
            const newHeight = observedElement.offsetHeight;
            // console.log("AppControls reporting height:", newHeight); // Debug log
            onHeightChange(newHeight); // Call the callback passed from parent
        };

        const resizeObserver = new ResizeObserver(reportHeight);
        resizeObserver.observe(observedElement);
        reportHeight(); // Report initial height

        // Cleanup
        return () => {
            if (observedElement) { // Check element still exists
                resizeObserver.unobserve(observedElement);
            }
        };
        // Dependencies: the ref's current value and the callback function
    }, [contRef]);

    return (
        <Container variant="control-bar" ref={contRef}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onJsonFileSelected}
                accept=".json"
                style={{ display: 'none' }}
            />

            <Container variant="control-group">
                <Button variant="back" onClick={onBack} disabled={!isBackEnabled}>
                    Back
                </Button>
                {onZoomIn && <Button onClick={onZoomIn} variant="default" className="p-1">Zoom In</Button>}
                {onZoomOut && <Button onClick={onZoomOut} variant="default" className="p-1">Zoom Out</Button>}
                {onResetTransform && <Button onClick={onResetTransform} variant="default" className="p-1">Reset</Button>}
            </Container>

            <Container variant="control-group">

                {isAdminEnabled && (
                    (editAction === 'changing_root_image')
                        ? (
                            <Container variant='default' className='flex items-end gap-2 pl-4 border-l ml-2'> {/* Simple container for this mode */}
                                <div className="flex-grow">
                                    <Label htmlFor="newRootUrlCtrl" className="block text-xs font-medium text-gray-600 mb-1">
                                        New Root Image URL:
                                    </Label>
                                    <Input
                                        type="text"
                                        id="newRootUrlCtrl"
                                        value={newRootUrlInput}
                                        // Use onChange handler passed from Mapdraw
                                        onChange={(e) => onNewRootUrlChange?.(e.target.value)}
                                        placeholder="Enter new image URL"
                                        className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                {/* Use handlers passed from Mapdraw */}
                                <Button onClick={onConfirmChangeRootImage} variant="primary" className="py-1.5">Save</Button>
                                <Button onClick={onCancelChangeRootImage} variant="default" className="py-1.5">Cancel</Button>
                            </Container>
                        )
                        : (isEditMode)
                            ? (
                                <EditModeControls
                                    onToggleEditMode={onToggleEditMode}
                                    setEditAction={setEditAction}
                                    editAction={editAction}
                                />
                            )
                            : (
                                <>
                                    {isCurrentlyOnRootMap && onChangeRootImage && (
                                        <Button variant="default" onClick={onChangeRootImage}>
                                            Change Root Image
                                        </Button>
                                    )}
                                    <Button variant="default" onClick={handleImportClick}>
                                        Import JSON
                                    </Button>
                                    <NormalModeControls
                                        onExportJson={onExportJson}
                                        onToggleEditMode={onToggleEditMode}
                                    />
                                </>
                            )
                )}
            </Container>
        </Container>
    );
};

export default AppControls;