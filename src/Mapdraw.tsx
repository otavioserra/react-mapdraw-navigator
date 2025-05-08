// src/Mapdraw.tsx
import React, { useCallback, useState, ChangeEvent, FormEvent, useRef } from 'react';
import Modal from 'react-modal';
import MapImageViewer, { MapImageViewerRefHandle } from './components/MapImageViewer';
import AppControls from './components/AppControls';
import Container from './components/Container';
import Button from './components/Button';
import Heading from './components/Heading';
import Label from './components/Label';
import Input from './components/Input';
import Form from './components/Form';
import { useMapNavigation, Hotspot, MapCollection } from './hooks/useMapNavigation';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';

// Define a simpler config type inline or separately
export interface MapdrawConfig {
    isAdminEnabled?: boolean;
    baseDims?: { width: number; height: number };
}

interface RelativeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MapdrawProps {
    rootMapId: string;
    className?: string;
    initialDataJsonString?: string;
    config?: MapdrawConfig;
    onHeightChange?: (height: number) => void;
}

const generateUniqueIdPart = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

const Mapdraw: React.FC<MapdrawProps> = ({
    rootMapId,
    className,
    initialDataJsonString,
    config,
    onHeightChange
}) => {
    const {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspotAndMapDefinition,
        managedMapData,
        editAction,
        setEditAction,
        deleteHotspot,
        loadNewMapData
    } = useMapNavigation(rootMapId, initialDataJsonString);

    // --- Component State ---
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newHotspotRect, setNewHotspotRect] = useState<RelativeRect | null>(null);
    const [newMapUrlInput, setNewMapUrlInput] = useState('');
    const [pendingGeneratedMapId, setPendingGeneratedMapId] = useState<string | null>(null);
    const [hotspotToDeleteId, setHotspotToDeleteId] = useState<string | null>(null);
    const mapViewerRef = useRef<MapImageViewerRefHandle>(null);
    const [newRootUrlInput, setNewRootUrlInput] = useState('');

    // Configs
    const isAdminEnabled = config?.isAdminEnabled ?? false;
    const isCurrentlyOnRootMap = currentMapId === rootMapId;

    // --- Event Handlers ---
    const handleHotspotClick = useCallback((mapId: string) => {
        // Prevent navigation if in delete selection mode (or potentially other edit modes)
        if (isEditMode && editAction === 'selecting_for_deletion') {
            // Selection logic will happen in MapImageViewer's own click handler
            return;
        }
        // Prevent navigation if in adding mode (drawing)
        if (isEditMode && editAction === 'adding') {
            return;
        }
        // Allow navigation if not in edit mode or if edit mode is 'none'
        if (!isEditMode || editAction === 'none') {
            navigateToChild(mapId);
        }
    }, [navigateToChild, isEditMode, editAction]); // Add isEditMode and editAction dependencies
    const handleHotspotDrawn = useCallback((rect: RelativeRect) => {
        // Only trigger if the current action is 'adding'
        if (editAction !== 'adding') {
            console.warn("Hotspot drawn but editAction is not 'adding'. Ignoring.");
            return; // Or provide user feedback
        }
        setNewHotspotRect(rect);
        const generatedMapId = `map_${generateUniqueIdPart()}`;
        setPendingGeneratedMapId(generatedMapId);
        setNewMapUrlInput('');
        setIsModalOpen(true);
    }, [editAction]); // Add editAction dependency
    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
        setNewHotspotRect(null);
        setNewMapUrlInput('');
        setPendingGeneratedMapId(null); // Reset the pending generated ID
    }, []);

    // MODIFY the block starting around Line 50:
    const handleModalSubmit = useCallback((event: FormEvent) => {
        event.preventDefault(); // Prevent default form submission

        // --- Step 3: Add check for pendingGeneratedMapId ---
        if (!pendingGeneratedMapId) {
            console.error("Submission failed: No generated Map ID available.");
            alert("An internal error occurred. Please try creating the hotspot again.");
            handleModalCancel(); // Close modal and clear state
            return;
        }
        // Use the generated ID from state for further processing
        const newMapId = pendingGeneratedMapId;
        // --- End Step 3 check ---

        // Ensure a map is currently loaded before trying to add a hotspot
        // (Keep this check from previous steps)
        if (!currentMapId) {
            alert("Cannot add hotspot: No map is currently loaded.");
            console.error("handleModalSubmit called but currentMapId is null.");
            return; // Stop the submission
        }

        // Ensure hotspot rectangle data exists
        // (Keep this check from previous steps)
        if (!newHotspotRect) {
            console.error("handleModalSubmit called but newHotspotRect is null.");
            return; // Stop the submission
        }

        // Get and validate URL input
        const newMapUrl = newMapUrlInput.trim(); // <<< Keep getting URL from input state
        if (!newMapUrl) { // <<< Keep URL validation
            alert("Please fill in the Map URL."); // Adjusted alert message
            return;
        }
        // Basic URL validation (optional but recommended)
        try { new URL(newMapUrl); } catch (_) { if (!newMapUrl.startsWith('/')) { alert('Please enter a valid image URL...'); return; } }


        // Check for duplicate ID using the generated newMapId
        // (Keep this check from previous steps)
        if (managedMapData && managedMapData[newMapId]) {
            alert(`Error: Map ID "${newMapId}" already exists. This should not happen with generated IDs, but checking anyway.`);
            // If this happens, the ID generation logic might need improvement
            return;
        }

        // Create new hotspot object
        // (Confirm link_to_map_id uses the generated newMapId)
        const newHotspot: Hotspot = {
            id: `hs_${currentMapId}_${generateUniqueIdPart()}`,
            x: newHotspotRect.x,
            y: newHotspotRect.y,
            width: newHotspotRect.width,
            height: newHotspotRect.height,
            link_to_map_id: newMapId, // <<< Correctly uses the generated ID
        };

        // Call hook function
        // (Confirm arguments are correct: currentMapId, newHotspot, newMapUrl)
        addHotspotAndMapDefinition(currentMapId, newHotspot, newMapUrl);

        // Reset state and close modal
        // (Keep cleanup logic - calling handleModalCancel covers resetting pendingGeneratedMapId)
        handleModalCancel();

    }, [
        // Update dependencies
        currentMapId,
        newHotspotRect,
        pendingGeneratedMapId, // Keep this dependency
        newMapUrlInput,
        addHotspotAndMapDefinition,
        handleModalCancel,
        managedMapData
    ]);
    // --- End of handleModalSubmit modification ---

    // Handler for when a hotspot is clicked in 'selecting_for_deletion' mode
    const handleSelectHotspotForDeletion = useCallback((hotspotId: string) => {
        setHotspotToDeleteId(prevId => (prevId === hotspotId ? null : hotspotId)); // Select or toggle deselect
    }, []);

    // Handler to clear the selection (e.g., clicking background)
    const handleClearDeletionSelection = useCallback(() => {
        setHotspotToDeleteId(null);
    }, []);

    // Handler to actually delete the selected hotspot
    // This will be called by the delete button rendered in MapImageViewer
    const handleConfirmDeletion = useCallback((hotspotIdToDelete: string) => {
        if (!currentMapId) {
            console.error("Cannot delete hotspot: currentMapId is not set.");
            return;
        }
        deleteHotspot(currentMapId, hotspotIdToDelete);
        setHotspotToDeleteId(null); // Clear selection after deletion
        // Optional: setEditAction('none') or stay in selection mode? Let's stay.
    }, [currentMapId, deleteHotspot]); // Include deleteHotspot from the hook

    // Replace the existing toggleEditMode function (around line 140) with this:
    const toggleEditMode = useCallback(() => {
        setIsEditMode(prevIsEditMode => {
            const exitingEditMode = prevIsEditMode; // If it was true, we are now exiting
            if (exitingEditMode) {
                // Reset the edit action when exiting edit mode
                setEditAction('none'); // Use the setter from the hook
            }
            return !prevIsEditMode; // Toggle the local state
        });
    }, [setEditAction]); // Add setEditAction from the hook as a dependency

    // --- Keep handleExportJson function ---
    const handleExportJson = useCallback(() => {
        if (!managedMapData) return;
        try {
            const jsonString = JSON.stringify(managedMapData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'map-data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) { console.error("Export failed:", err); }
    }, [managedMapData]);

    // --- File Import Handler (Now defined inside Mapdraw) ---
    const handleFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const inputElement = event.target; // Keep ref to input element

        if (!file) { return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                // Call the hook's function to load the new data
                loadNewMapData(text);
            } else {
                console.error("FileReader result was not a string.");
                alert(`Error: Could not read content from "${file.name}".`);
            }
            // Clear input value after processing
            if (inputElement) inputElement.value = '';
        };
        reader.onerror = (e) => {
            console.error("Failed to read file:", e);
            alert(`Error: Could not read the selected file "${file.name}".`);
            if (inputElement) inputElement.value = '';
        };
        reader.readAsText(file);
    }, [loadNewMapData]); // Dependency on the hook's function

    const handleZoomIn = useCallback(() => {
        mapViewerRef.current?.doZoomIn();
    }, []);

    const handleZoomOut = useCallback(() => {
        mapViewerRef.current?.doZoomOut();
    }, []);

    const handleResetTransform = useCallback(() => {
        mapViewerRef.current?.doResetTransform();
    }, []);

    const handleInitiateChangeRootImage = useCallback(() => {
        if (!currentMapId || currentMapId !== rootMapId) return; // Ensure we are on root map

        setNewRootUrlInput(currentMapDisplayData?.imageUrl || ''); // Pre-fill input
        setEditAction('changing_root_image'); // Set the new mode
        setHotspotToDeleteId(null); // Clear any deletion selection state

    }, [currentMapId, rootMapId, setEditAction, currentMapDisplayData?.imageUrl]);

    const handleConfirmChangeRootImage = useCallback(() => {
        // rootMapId comes from props (the initial root for this instance)
        if (!rootMapId) {
            console.error("Cannot change root image: Initial rootMapId is missing.");
            return;
        }

        const trimmedUrl = newRootUrlInput.trim();
        if (!trimmedUrl) {
            alert("Image URL cannot be empty.");
            return;
        }
        // Basic URL validation
        try { new URL(trimmedUrl); } catch (_) { if (!trimmedUrl.startsWith('/')) { alert('Invalid URL format.'); return; } }

        // --- Action: Create minimal data structure and call loadNewMapData ---
        console.log(`Attempting to reset map data with new root image for map '${rootMapId}': ${trimmedUrl}`);

        // 1. Create the minimal new map data object
        const newMapData: MapCollection = {
            [rootMapId]: { // Use the original rootMapId as the key
                imageUrl: trimmedUrl,
                hotspots: [] // Start with no hotspots
            }
        };

        // 2. Convert to JSON string
        const newJsonString = JSON.stringify(newMapData);

        // 3. Call the hook function to load this new structure, replacing everything else
        loadNewMapData(newJsonString);
        // loadNewMapData already handles:
        // - setManagedMapData(newMapData)
        // - setCurrentMapId(rootMapId)
        // - setCurrentMapDisplayData
        // - setNavigationHistory([])
        // - setError(null)
        // - setEditAction('none')

        // --- End of new logic ---

        setEditAction('none'); // Exit the changing mode (loadNewMapData also does this, but explicit here is ok)
        setNewRootUrlInput(''); // Clear the input

    }, [rootMapId, newRootUrlInput, loadNewMapData, setEditAction]);

    const handleCancelChangeRootImage = useCallback(() => {
        setEditAction('none'); // Exit the changing mode
        setNewRootUrlInput(''); // Clear the input
    }, [setEditAction]);

    // --- Styling ---
    const containerClasses = `mapdraw-container relative ${className || ''}`.trim(); // Removed 'relative' as it might not be needed here anymore

    // --- Render Logic (Refactored) ---
    return (
        // Use Container for the main wrapper - pass computed className
        <TooltipProvider delayDuration={150}>
            <Container className={containerClasses}>
                <AppControls
                    onBack={navigateBack}
                    canGoBack={canGoBack}
                    isEditMode={isEditMode}
                    onToggleEditMode={toggleEditMode}
                    onExportJson={handleExportJson}
                    editAction={editAction}
                    setEditAction={setEditAction}
                    onJsonFileSelected={handleFileSelected}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetTransform={handleResetTransform}
                    isAdminEnabled={isAdminEnabled}
                    isCurrentlyOnRootMap={isCurrentlyOnRootMap}
                    onChangeRootImage={handleInitiateChangeRootImage} // Triggers the mode
                    newRootUrlInput={newRootUrlInput} // Input value state
                    onNewRootUrlChange={setNewRootUrlInput} // Input onChange handler (setter)
                    onConfirmChangeRootImage={handleConfirmChangeRootImage} // Save button handler
                    onCancelChangeRootImage={handleCancelChangeRootImage}
                    onHeightChange={onHeightChange}
                />

                {/* Display Error Messages using Container */}
                {error && <Container variant="error-message">Error: {error}</Container>}

                {/* Display Map Viewer */}
                {currentMapDisplayData && !error && (
                    <MapImageViewer
                        ref={mapViewerRef}
                        imageUrl={currentMapDisplayData.imageUrl}
                        hotspots={currentMapDisplayData.hotspots}
                        onHotspotClick={handleHotspotClick}
                        isEditMode={isEditMode}
                        onHotspotDrawn={handleHotspotDrawn}
                        editAction={editAction}
                        currentMapId={currentMapId}
                        hotspotToDeleteId={hotspotToDeleteId}
                        onSelectHotspotForDeletion={handleSelectHotspotForDeletion}
                        onClearSelection={handleClearDeletionSelection}
                        onConfirmDeletion={handleConfirmDeletion}
                    />
                )}

                {/* Display message if map data not available using Container */}
                {!currentMapDisplayData && !error && (
                    <Container variant="info-message">
                        Map data is not available...
                    </Container>
                )}

                {/* Modal using react-modal */}
                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={handleModalCancel}
                    contentLabel="Add New Hotspot Details" // Updated label
                    className="m-auto bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 outline-none"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                >
                    {/* Use Heading component */}
                    <Heading level={2} className="text-xl font-semibold mb-5 text-gray-800">
                        Add New Hotspot Details
                    </Heading>
                    <Form onSubmit={handleModalSubmit}>
                        {pendingGeneratedMapId && (
                            // Use Container for consistent form grouping (optional)
                            <Container variant="default" className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Generated Map ID:
                                    <strong className="ml-2 font-mono select-all bg-gray-100 px-1 py-0.5 rounded">
                                        {pendingGeneratedMapId}
                                    </strong>
                                </p>
                            </Container>
                        )}

                        {/* Use Container for form group */}
                        <Container variant="form-group">
                            {/* Use Label component */}
                            <Label htmlFor="mapUrl" className="block text-gray-700 text-sm font-medium mb-2">
                                New Map Image URL:
                            </Label>
                            {/* Use Input component */}
                            <Input
                                type="text"
                                id="mapUrl"
                                value={newMapUrlInput}
                                onChange={(e) => setNewMapUrlInput(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Enter image URL (http://... or /images/...)"
                                required
                                autoFocus
                            />
                        </Container>

                        {/* Use Container for modal actions */}
                        <Container variant="modal-actions">
                            {/* Use Button component for modal actions */}
                            <Button
                                type="button"
                                variant="default" // Or a specific 'cancel' variant if you add one
                                onClick={handleModalCancel}
                            // Add base classes if needed, or handle in Button component variants
                            // className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary" // Use primary variant
                            // className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Add Hotspot
                            </Button>
                        </Container>
                    </Form>
                </Modal>
            </Container> // Close the outermost Container
        </TooltipProvider>
    );
};

export default Mapdraw;