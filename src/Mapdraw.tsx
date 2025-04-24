// src/Mapdraw.tsx
import React, { useCallback, useState, ChangeEvent, MouseEvent, FormEvent } from 'react';
import Modal from 'react-modal';
import MapImageViewer from './components/MapImageViewer';
import AppControls from './components/AppControls';
import { useMapNavigation, Hotspot, MapCollection } from './hooks/useMapNavigation';

interface RelativeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface MapdrawProps { rootMapId: string; className?: string; initialDataJsonString?: string; }
const generateUniqueIdPart = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

const Mapdraw: React.FC<MapdrawProps> = ({
    rootMapId,
    className,
    initialDataJsonString
}) => {
    const {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack, // <<< Keep this function from the hook
        canGoBack,    // <<< Keep this state from the hook
        error,
        addHotspotAndMapDefinition,
        managedMapData,
    } = useMapNavigation(rootMapId, initialDataJsonString);

    // --- Component State ---
    const [isEditMode, setIsEditMode] = useState<boolean>(false); // <<< Keep this state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newHotspotRect, setNewHotspotRect] = useState<RelativeRect | null>(null);
    const [newMapUrlInput, setNewMapUrlInput] = useState('');
    const [pendingGeneratedMapId, setPendingGeneratedMapId] = useState<string | null>(null);

    // --- Event Handlers ---
    const handleHotspotClick = useCallback((mapId: string) => {
        navigateToChild(mapId);
    }, [navigateToChild]);
    const handleHotspotDrawn = useCallback((rect: RelativeRect) => {
        setNewHotspotRect(rect);
        const generatedMapId = `map_${generateUniqueIdPart()}`; // Generate ID
        setPendingGeneratedMapId(generatedMapId); // Store generated ID
        setNewMapUrlInput(''); // Clear URL input
        setIsModalOpen(true);
    }, []);
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

        console.log(`Added new hotspot '${newHotspot.id}' linking to new map '${newMapId}' with image '${newMapUrl}'`);

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

    // --- Keep toggleEditMode function ---
    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

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

    // --- Styling ---
    const containerClasses = `mapdraw-container ${className || ''}`.trim(); // Removed 'relative' as it might not be needed here anymore
    // Remove button styles that were moved
    const inputLabelStyle: React.CSSProperties = { /* ... */ };
    const inputStyle: React.CSSProperties = { /* ... */ };

    // --- Render Logic ---
    return (
        <div className={containerClasses}>
            <AppControls
                onBack={navigateBack} // Pass hook function
                canGoBack={canGoBack} // Pass hook state
                isEditMode={isEditMode} // Pass local state
                onToggleEditMode={toggleEditMode} // Pass local state setter function
                onExportJson={handleExportJson} // Pass local handler function
            />

            {/* Display Error Messages */}
            {error && <div className="p-3 my-3 border border-red-500 text-red-700 bg-red-100 rounded">Error: {error}</div>}

            {/* Display Map Viewer */}
            {currentMapDisplayData && !error && (
                <MapImageViewer
                    key={currentMapId}
                    imageUrl={currentMapDisplayData.imageUrl}
                    hotspots={currentMapDisplayData.hotspots}
                    onHotspotClick={handleHotspotClick}
                    isEditMode={isEditMode}
                    onHotspotDrawn={handleHotspotDrawn}
                />
            )}

            {/* Display message if map data not available */}
            {!currentMapDisplayData && !error && (
                <div className="p-5 text-center text-gray-500">
                    Map data is not available...
                </div>
            )}


            <Modal
                isOpen={isModalOpen}
                onRequestClose={handleModalCancel}
                contentLabel="Add New Hotspot" // Accessibility label

                // --- Use Tailwind via className props INSTEAD of inline 'style' prop ---
                // Adjust classes as needed for your desired appearance
                className="m-auto bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 outline-none" // Styles the modal content box
                overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" // Styles the background overlay
            >
                <h2 className="text-xl font-semibold mb-5 text-gray-800">Add New Hotspot</h2>
                <form onSubmit={handleModalSubmit}>
                    {pendingGeneratedMapId && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Generated Map ID:
                                <strong className="ml-2 font-mono select-all bg-gray-100 px-1 py-0.5 rounded">
                                    {pendingGeneratedMapId}
                                </strong>
                            </p>
                        </div>
                    )}

                    <div className="mb-6">
                        <label htmlFor="mapUrl" className="block text-gray-700 text-sm font-medium mb-2">
                            New Map Image URL:
                        </label>
                        <input
                            type="text"
                            id="mapUrl"
                            value={newMapUrlInput}
                            onChange={(e) => setNewMapUrlInput(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter image URL (http://... or /images/...)"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={handleModalCancel}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add Hotspot
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

export default Mapdraw;