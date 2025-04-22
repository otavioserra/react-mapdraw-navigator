import React, { useCallback } from 'react';
import MapImageViewer from './components/MapImageViewer';
import NavigationControls from './components/NavigationControls';
// Import the revised hook
import { useMapNavigation } from './hooks/useMapNavigation';

interface MapdrawProps {
    rootMapId: string;
    // Add any other configuration props if needed (e.g., container styles)
    className?: string; // Allow passing custom class for styling
}

const Mapdraw: React.FC<MapdrawProps> = ({ rootMapId, className }) => {
    const {
        currentMapId, // We get the current ID now too
        currentMapDisplayData, // Renamed from currentMapData
        navigateToChild,
        navigateBack,
        canGoBack,
        error, // Get the error state from the hook
    } = useMapNavigation(rootMapId); // Hook now uses imported JSON

    // Memoize the hotspot click handler - dependency is stable
    const handleHotspotClick = useCallback((mapId: string) => {
        navigateToChild(mapId);
    }, [navigateToChild]);

    const containerClasses = `mapdraw-container ${className || ''}`.trim();

    return (
        <div className={containerClasses}>
            {/* TODO: Add specific styling for the container via CSS */}
            <NavigationControls
                onBack={navigateBack}
                isBackEnabled={canGoBack} // Hook manages enabling/disabling logic
            />

            {/* Display Error State if a map lookup failed */}
            {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '10px 0' }}>Error: {error}</div>}

            {/* Display Map Viewer only when data is available */}
            {currentMapDisplayData && !error && (
                <MapImageViewer
                    // Use a key based on the mapId to force re-render on map change if needed,
                    // though changing imageUrl should be sufficient. Optional optimization.
                    // key={currentMapId}
                    imageUrl={currentMapDisplayData.imageUrl}
                    hotspots={currentMapDisplayData.hotspots}
                    onHotspotClick={handleHotspotClick}
                />
            )}

            {/* Fallback if no data and no error (e.g., initial state or invalid root ID) */}
            {!currentMapDisplayData && !error && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Map data is not available. Ensure the rootMapId ('{rootMapId}') exists in map-data.json.
                </div>
            )}
        </div>
    );
};

export default Mapdraw;
