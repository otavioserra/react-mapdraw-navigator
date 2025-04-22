// src/Mapdraw.tsx
import React, { useCallback, useState, ChangeEvent } from 'react';
import Modal from 'react-modal'; // Using react-modal for the popup
import MapImageViewer from './components/MapImageViewer';
import NavigationControls from './components/NavigationControls';
// Import types and the specific hook function name
import { useMapNavigation, Hotspot, MapCollection } from './hooks/useMapNavigation';

// Interface for the rectangle coordinates (relative percentages) from drawing
interface RelativeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Props for the Mapdraw component
interface MapdrawProps {
    rootMapId: string; // ID of the initial map to display
    className?: string; // Optional CSS class for the container
    initialDataJsonString?: string; // Optional JSON string for initial data
}

// Helper to generate a simple unique ID part (replace if needed)
const generateUniqueIdPart = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

// The main Mapdraw component
const Mapdraw: React.FC<MapdrawProps> = ({
    rootMapId,
    className,
    initialDataJsonString
}) => {
    // Use the custom navigation hook
    const {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspotAndMapDefinition, // Get the function to add hotspot and map def
        managedMapData, // Get current data state for validation/export
    } = useMapNavigation(rootMapId, initialDataJsonString);

    // --- Component State ---
    const [isEditMode, setIsEditMode] = useState<boolean>(false); // Toggle for edit mode
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Controls modal visibility
    const [newHotspotRect, setNewHotspotRect] = useState<RelativeRect | null>(null); // Stores drawn rect coords

    // --- State for Modal Inputs ---
    const [newMapIdInput, setNewMapIdInput] = useState(''); // Input for the NEW MAP's ID
    const [newMapUrlInput, setNewMapUrlInput] = useState(''); // Input for the NEW MAP's Image URL

    // --- Event Handlers ---

    // Handles clicks on existing hotspots (navigates if not in edit mode)
    const handleHotspotClick = useCallback((mapId: string) => {
        if (!isEditMode) {
            navigateToChild(mapId);
        }
    }, [navigateToChild, isEditMode]);

    // Called by MapImageViewer when a rectangle is drawn in edit mode
    const handleHotspotDrawn = useCallback((relativeRect: RelativeRect) => {
        console.log('New Hotspot Drawn (Relative %):', relativeRect);
        setNewHotspotRect(relativeRect);
        // Suggest a unique ID for the new map when opening the modal
        const suggestedMapId = `map_${generateUniqueIdPart()}`;
        setNewMapIdInput(suggestedMapId); // Pre-fill Map ID input
        setNewMapUrlInput(''); // Clear URL input
        setIsModalOpen(true); // Open the modal
    }, []);

    // Handles the submission of the modal form
    const handleModalSubmit = useCallback(() => {
        const newMapId = newMapIdInput.trim(); // Get and trim the new map ID
        const newMapUrl = newMapUrlInput.trim(); // Get and trim the new map URL

        // --- Input Validation ---
        if (!newMapId) {
            alert('Please enter a unique ID for the new map.');
            return;
        }
        if (!newMapUrl) {
            alert('Please enter the image URL for the new map.');
            return;
        }
        // Basic URL validation (allow relative paths starting with /)
        try {
            new URL(newMapUrl);
        } catch (_) {
            if (!newMapUrl.startsWith('/')) {
                alert('Please enter a valid image URL (starting with http://, https://, or / for local public images).');
                return;
            }
        }

        // Check if required data is available
        if (!newHotspotRect || !currentMapId || !addHotspotAndMapDefinition) {
            console.error("Missing data required to add hotspot/map definition.");
            alert("An internal error occurred. Cannot save hotspot.");
            return;
        };

        // --- IMPORTANT: Validate if newMapId already exists in the data ---
        if (managedMapData && managedMapData[newMapId]) {
            alert(`Error: Map ID "${newMapId}" already exists. Please choose a unique ID.`);
            return; // Stop submission if ID is duplicate
        }

        // --- Generate a unique ID FOR THE HOTSPOT element itself ---
        const hotspotId = `hs_${currentMapId}_${generateUniqueIdPart()}`;

        // --- Construct the New Hotspot object CORRECTLY ---
        const newHotspot: Hotspot = {
            id: hotspotId, // Unique ID for this specific hotspot element
            x: newHotspotRect.x, // Use coordinates from the drawn rectangle
            y: newHotspotRect.y,
            width: newHotspotRect.width,
            height: newHotspotRect.height,
            link_to_map_id: newMapId // <<< CRITICAL: Link to the NEW map's ID
        };

        // --- Call the hook function to add BOTH the hotspot and the new map definition ---
        addHotspotAndMapDefinition(currentMapId, newHotspot, newMapUrl);

        console.log(`Added new hotspot '${hotspotId}' linking to new map '${newMapId}' with image '${newMapUrl}'`);
        setIsModalOpen(false); // Close modal on successful submission

    }, [
        newMapIdInput, // Dependency on modal input state
        newMapUrlInput, // Dependency on modal input state
        newHotspotRect, // Dependency on drawn rectangle data
        currentMapId, // Dependency on the current map where hotspot is added
        addHotspotAndMapDefinition, // Dependency on the hook function
        managedMapData // Dependency for duplicate ID check
    ]);

    // Handles closing the modal (cancel button, overlay click, ESC)
    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // Toggles the edit mode state
    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

    // Handles exporting the current map data state to a JSON file
    const handleExportJson = useCallback(() => {
        if (!managedMapData) {
            console.error("No map data available to export.");
            alert("Error: No map data available to export.");
            return;
        }
        try {
            const jsonString = JSON.stringify(managedMapData, null, 2); // Pretty print
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'map-data.json'; // Filename for download
            document.body.appendChild(link);
            link.click(); // Trigger download
            document.body.removeChild(link); // Clean up link
            URL.revokeObjectURL(url); // Clean up object URL
            console.log("Map data exported successfully.");
        } catch (err) {
            console.error("Failed to export map data:", err);
            alert(`Error exporting JSON: ${err instanceof Error ? err.message : String(err)}`);
        }
    }, [managedMapData]); // Depends on the current data state

    // --- Styling (Consider moving to Tailwind classes or CSS Modules) ---
    const containerClasses = `mapdraw-container relative ${className || ''}`.trim(); // Added relative positioning
    const baseButtonStyle: React.CSSProperties = {
        padding: '5px 10px', cursor: 'pointer',
        border: '1px solid #ccc', borderRadius: '4px',
        whiteSpace: 'nowrap' // Prevent button text wrapping
    };
    const controlsContainerStyle: React.CSSProperties = {
        position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '10px'
    };
    // Basic styles for modal inputs
    const inputLabelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
    const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box' };
    const modalButtonStyle: React.CSSProperties = { /* Define styles or use Tailwind */ };

    // --- Render Logic ---
    return (
        <div className={containerClasses}> {/* Use className for container */}

            {/* Control Buttons (Export, Edit Mode Toggle) */}
            <div style={controlsContainerStyle}>
                <button onClick={handleExportJson} style={{ ...baseButtonStyle, backgroundColor: '#ddeeff' }}>
                    Export JSON
                </button>
                <button onClick={toggleEditMode} style={{ ...baseButtonStyle, backgroundColor: isEditMode ? '#ffdddd' : '#ddffdd' }}>
                    {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                </button>
            </div>

            {/* Navigation Controls (Back Button) */}
            <NavigationControls
                onBack={navigateBack}
                isBackEnabled={canGoBack && !isEditMode} // Disable back button in edit mode
            />

            {/* Display Error Messages */}
            {error && <div className="p-3 my-3 border border-red-500 text-red-700 bg-red-100 rounded">Error: {error}</div>}

            {/* Display Map Viewer if data is available and no error */}
            {currentMapDisplayData && !error && (
                <MapImageViewer
                    key={currentMapId} // Key helps React reset state if needed on map change
                    imageUrl={currentMapDisplayData.imageUrl}
                    hotspots={currentMapDisplayData.hotspots}
                    onHotspotClick={handleHotspotClick}
                    isEditMode={isEditMode}
                    onHotspotDrawn={handleHotspotDrawn} // Pass the callback for drawing
                />
            )}

            {/* Display message if map data is not available */}
            {!currentMapDisplayData && !error && (
                <div className="p-5 text-center text-gray-500">
                    Map data is not available. Ensure the rootMapId ('{rootMapId}') exists in the loaded map data.
                </div>
            )}

            {/* Modal for Creating New Hotspot and Map */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={handleModalCancel} // Close on overlay click or ESC
                // style={customModalStyles} // Apply custom styles or use Tailwind classes
                contentLabel="Create New Hotspot and Map" // Accessibility label
                // Use Tailwind classes for modal styling if preferred
                className="m-auto bg-white p-6 rounded shadow-lg max-w-md w-full outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
                <h3 className="text-xl font-bold mb-4">Create New Hotspot and Linked Map</h3>

                {/* Input for New Map ID */}
                <label htmlFor="newMapIdInput" style={inputLabelStyle}>New Map ID:</label>
                <input
                    id="newMapIdInput"
                    type="text"
                    value={newMapIdInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMapIdInput(e.target.value)}
                    style={inputStyle} // Or use Tailwind classes
                    placeholder="Enter a unique ID (e.g., detail_view_1)"
                    autoFocus // Focus on this input when modal opens
                />

                {/* Input for New Map Image URL */}
                <label htmlFor="newMapUrlInput" style={inputLabelStyle}>New Map Image URL:</label>
                <input
                    id="newMapUrlInput"
                    type="text"
                    value={newMapUrlInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMapUrlInput(e.target.value)}
                    style={inputStyle} // Or use Tailwind classes
                    placeholder="Enter image URL (http://... or /images/...)"
                />

                {/* Modal Action Buttons */}
                <div className="text-right mt-4 space-x-3">
                    <button
                        onClick={handleModalSubmit}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Save Hotspot & Create Map
                    </button>
                    <button
                        onClick={handleModalCancel}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Mapdraw;
