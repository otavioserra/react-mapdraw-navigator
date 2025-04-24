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
    const [newMapIdInput, setNewMapIdInput] = useState('');
    const [newMapUrlInput, setNewMapUrlInput] = useState('');

    // --- Event Handlers ---
    const handleHotspotClick = useCallback((mapId: string) => {
        navigateToChild(mapId);
    }, [navigateToChild]);
    const handleHotspotDrawn = useCallback((rect: RelativeRect) => {
        setNewHotspotRect(rect);
        setIsModalOpen(true);
    }, []);
    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
        setNewHotspotRect(null);
        setNewMapIdInput('');
        setNewMapUrlInput('');
    }, []);

    const handleModalSubmit = useCallback((event: FormEvent) => { // Added FormEvent type
        event.preventDefault(); // Prevent default form submission

        // --- ADD THIS CHECK ---
        // Ensure a map is currently loaded before trying to add a hotspot
        if (!currentMapId) {
            alert("Cannot add hotspot: No map is currently loaded.");
            console.error("handleModalSubmit called but currentMapId is null.");
            return; // Stop the submission
        }
        // --- END CHECK ---

        // Ensure hotspot rectangle data exists
        if (!newHotspotRect) {
            console.error("handleModalSubmit called but newHotspotRect is null.");
            // Optionally show an alert to the user
            // alert("An error occurred: Hotspot location data is missing.");
            return; // Stop the submission
        }

        // Validate inputs
        const mapId = newMapIdInput.trim(); // Use trimmed values
        const mapUrl = newMapUrlInput.trim();
        if (!mapId || !mapUrl) {
            alert("Please fill in both Map ID and Map URL.");
            return;
        }

        // --- Add duplicate check ---
        if (managedMapData && managedMapData[mapId]) {
            alert(`Error: Map ID "${mapId}" already exists. Please choose a unique ID.`);
            return;
        }
        // --- End duplicate check ---


        // Create new hotspot object
        const newHotspot: Hotspot = {
            id: `hs_${currentMapId}_${generateUniqueIdPart()}`, // Use currentMapId in ID for context
            x: newHotspotRect.x,
            y: newHotspotRect.y,
            width: newHotspotRect.width,
            height: newHotspotRect.height,
            link_to_map_id: mapId, // Use validated mapId
        };

        // Now currentMapId is guaranteed to be a string here
        addHotspotAndMapDefinition(currentMapId, newHotspot, mapUrl); // Pass validated mapUrl

        // Reset state and close modal
        handleModalCancel(); // Reuse cancel logic to reset inputs and close

    }, [
        currentMapId, // <<< Add currentMapId as dependency
        newHotspotRect,
        newMapIdInput,
        newMapUrlInput,
        addHotspotAndMapDefinition,
        handleModalCancel,
        managedMapData // <<< Add managedMapData as dependency
    ]);

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
                {/* Apply Tailwind classes to modal content */}
                <h2 className="text-xl font-semibold mb-5 text-gray-800">Add New Hotspot</h2>
                {/* Use form element for better accessibility and handling */}
                <form onSubmit={handleModalSubmit}>
                    <div className="mb-4">
                        <label htmlFor="mapId" className="block text-gray-700 text-sm font-medium mb-2">
                            New Map ID:
                        </label>
                        <input
                            type="text"
                            id="mapId"
                            value={newMapIdInput}
                            onChange={(e) => setNewMapIdInput(e.target.value)}
                            // Apply Tailwind classes to input
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter a unique ID (e.g., detail_view_1)"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="mapUrl" className="block text-gray-700 text-sm font-medium mb-2">
                            New Map Image URL:
                        </label>
                        <input
                            type="text"
                            id="mapUrl"
                            value={newMapUrlInput}
                            onChange={(e) => setNewMapUrlInput(e.target.value)}
                            // Apply Tailwind classes to input
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Enter image URL (http://... or /images/...)"
                            required
                        />
                    </div>
                    {/* Apply Tailwind classes to button container and buttons */}
                    <div className="flex items-center justify-end space-x-3 mt-6">
                        <button
                            type="button" // Explicitly type="button" for cancel
                            onClick={handleModalCancel}
                            // Style for Cancel button
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" // Submit button
                            // Style for Add/Save button
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