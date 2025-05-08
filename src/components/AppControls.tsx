// src/components/AppControls.tsx
import React, { useEffect } from 'react';
import Button from './Button';
import Container from './Container';
import { EditAction } from '../hooks/useMapNavigation';
import Label from './Label';
import Input from './Input';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';

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
        <Button variant="export" onClick={onExportJson} tooltipContent="Export JSON">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
        </Button>
        <Button variant="toggle-off" onClick={onToggleEditMode} tooltipContent="Enter Edit Mode">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
            </svg>
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
            tooltipContent="Add Hotspot"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z" clipRule="evenodd" />
                <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
            </svg>
        </Button>

        <Button
            variant="remove"
            className={editAction === 'selecting_for_deletion' ? 'ring-2 ring-red-500' : ''}
            onClick={() => setEditAction('selecting_for_deletion')}
            tooltipContent="Remove Hotspot"
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM9.75 14.25a.75.75 0 0 0 0 1.5H15a.75.75 0 0 0 0-1.5H9.75Z" clipRule="evenodd" />
                <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
            </svg>
        </Button>

        <Button variant="toggle-on" onClick={onToggleEditMode} tooltipContent="Exit Edit Mode">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.81L8.03 17.03a.75.75 0 0 1-1.06-1.06L19.19 3.75h-3.44a.75.75 0 0 1 0-1.5Zm-10.5 4.5a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V10.5a.75.75 0 0 1 1.5 0v8.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V8.25a3 3 0 0 1 3-3h8.25a.75.75 0 0 1 0 1.5H5.25Z" clipRule="evenodd" />
            </svg>
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
    const contRef = React.useRef<HTMLDivElement>(null);

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
    }, [contRef, onHeightChange]);

    return (
        <Container variant="control-bar" ref={contRef}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onJsonFileSelected}
                accept=".json"
                style={{ display: 'none' }}
            />

            <TooltipProvider delayDuration={150}>
                <Container variant="control-group">
                    <Button variant="back" onClick={onBack} disabled={!isBackEnabled} tooltipContent="Back">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-4.28 9.22a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06l-1.72-1.72h5.69a.75.75 0 0 0 0-1.5h-5.69l1.72-1.72a.75.75 0 0 0-1.06-1.06l-3 3Z" clipRule="evenodd" />
                        </svg>
                    </Button>
                    {onZoomIn && <Button onClick={onZoomIn} variant="default" className="p-1" tooltipContent="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Zm8.25-3.75a.75.75 0 0 1 .75.75v2.25h2.25a.75.75 0 0 1 0 1.5h-2.25v2.25a.75.75 0 0 1-1.5 0v-2.25H7.5a.75.75 0 0 1 0-1.5h2.25V7.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                        </svg>
                    </Button>}
                    {onZoomOut && <Button onClick={onZoomOut} variant="default" className="p-1" tooltipContent="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Zm4.5 0a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                    </Button>}
                    {onResetTransform && <Button onClick={onResetTransform} variant="default" className="p-1" tooltipContent="Reset View">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                        </svg>
                    </Button>}
                </Container>

                <Container variant="control-group">
                    {isAdminEnabled && (
                        (editAction === 'changing_root_image')
                            ? (
                                <Container variant='default' className='flex items-end gap-2 pl-4 border-l ml-2'> {/* Simple container for this mode */}
                                    <Container className="flex-grow">
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
                                    </Container>
                                    {/* Use handlers passed from Mapdraw */}
                                    <Button onClick={onConfirmChangeRootImage} variant="primary" tooltipContent="Save New URL">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                        </svg>
                                    </Button>
                                    <Button onClick={onCancelChangeRootImage} variant="default" tooltipContent="Cancel Change">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                                        </svg>
                                    </Button>
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
                                            <Button variant="default" onClick={onChangeRootImage} tooltipContent="Change Root Image">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
                                                </svg>
                                            </Button>
                                        )}
                                        <Button variant="default" onClick={handleImportClick} tooltipContent="Import JSON">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V15a.75.75 0 0 0-1.5 0v3.75a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3V9A.75.75 0 1 0 9 9V5.25a1.5 1.5 0 0 1 1.5-1.5h6Zm-5.03 4.72a.75.75 0 0 0 0 1.06l1.72 1.72H2.25a.75.75 0 0 0 0 1.5h10.94l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 0 0-1.06 0Z" clipRule="evenodd" />
                                            </svg>
                                        </Button>
                                        <NormalModeControls
                                            onExportJson={onExportJson}
                                            onToggleEditMode={onToggleEditMode}
                                        />
                                    </>
                                )
                    )}
                </Container>
            </TooltipProvider>
        </Container>
    );
};

export default AppControls;