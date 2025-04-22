import { useState, useEffect, useCallback } from 'react';
// Import the static JSON data directly.
// Make sure the path is correct relative to this hook file.
import mapDataSource from '../data/map-data.json';

// --- Type Definitions ---

export interface Hotspot {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    link_to_map_id: string;
}

// Type for a single map's definition within the JSON
export interface MapDefinition {
    imageUrl: string;
    hotspots: Hotspot[];
}

// Type for the entire JSON data structure (a dictionary of map definitions)
export type MapCollection = Record<string, MapDefinition>;

// Type for the data needed by the MapImageViewer component
export interface MapDisplayData {
    imageUrl: string;
    hotspots: Hotspot[];
}

// Define the return type of the hook
interface UseMapNavigationReturn {
    currentMapId: string | null;
    currentMapDisplayData: MapDisplayData | null;
    navigateToChild: (childMapId: string) => void;
    navigateBack: () => void;
    canGoBack: boolean;
    error: string | null; // Keep error state for invalid map lookups
}

// Cast the imported JSON to our defined type for type safety
const allMapData: MapCollection = mapDataSource as MapCollection;

// The custom hook implementation using local JSON data
export const useMapNavigation = (initialMapId: string): UseMapNavigationReturn => {
    const [currentMapId, setCurrentMapId] = useState<string | null>(null);
    const [currentMapDisplayData, setCurrentMapDisplayData] = useState<MapDisplayData | null>(null);
    // History stores the IDs of the maps visited *before* the current one
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Function to safely get map data from the pre-loaded collection
    const getMapDataById = useCallback((mapId: string): MapDisplayData | null => {
        const mapDef = allMapData[mapId];
        if (mapDef) {
            // Return only the needed display properties
            return {
                imageUrl: mapDef.imageUrl,
                hotspots: mapDef.hotspots,
            };
        }
        console.error(`Map data not found for ID: ${mapId}`);
        setError(`Map data not found for ID: ${mapId}`);
        return null;
    }, []); // Dependency: allMapData is constant after import

    // Effect to load the initial map when the hook mounts or initialMapId changes
    useEffect(() => {
        setError(null); // Clear previous errors
        const initialData = getMapDataById(initialMapId);
        if (initialData) {
            setCurrentMapId(initialMapId);
            setCurrentMapDisplayData(initialData);
            setNavigationHistory([]); // Start with empty history
        } else {
            // Handle case where the initialMapId is invalid
            setCurrentMapId(null);
            setCurrentMapDisplayData(null);
            setNavigationHistory([]);
        }
    }, [initialMapId, getMapDataById]);

    // Function to navigate to a child map
    const navigateToChild = useCallback((childMapId: string) => {
        if (!currentMapId) return; // Cannot navigate if no map is currently loaded

        setError(null); // Clear previous errors
        const childData = getMapDataById(childMapId);

        if (childData) {
            // Push the *current* map ID onto the history stack before navigating
            setNavigationHistory(prevHistory => [...prevHistory, currentMapId]);
            // Update state to the new child map
            setCurrentMapId(childMapId);
            setCurrentMapDisplayData(childData);
        }
        // If childData is null, the error state is already set by getMapDataById
    }, [currentMapId, getMapDataById]);

    // Function to navigate back to the parent map
    const navigateBack = useCallback(() => {
        if (navigationHistory.length === 0) return; // Can't go back

        setError(null); // Clear previous errors
        // Get the last map ID from history (this is the parent)
        const parentMapId = navigationHistory[navigationHistory.length - 1];
        const parentData = getMapDataById(parentMapId);

        if (parentData) {
            // Update state to the parent map
            setCurrentMapId(parentMapId);
            setCurrentMapDisplayData(parentData);
            // Remove the last entry from history
            setNavigationHistory(prevHistory => prevHistory.slice(0, -1));
        } else {
            // This case should ideally not happen if history is managed correctly,
            // but handle it defensively.
            console.error(`Error navigating back: Parent map data (${parentMapId}) not found.`);
            setError(`Error navigating back: Parent map data (${parentMapId}) not found.`);
        }
    }, [navigationHistory, getMapDataById]);

    // Determine if the back button should be enabled
    const canGoBack = navigationHistory.length > 0;

    return {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
    };
};
