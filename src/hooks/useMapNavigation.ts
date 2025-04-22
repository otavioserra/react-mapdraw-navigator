import { useState, useEffect, useCallback } from 'react';
// Import the static JSON data directly.
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

export interface MapDefinition {
    imageUrl: string;
    hotspots: Hotspot[];
}

export type MapCollection = Record<string, MapDefinition>;

export interface MapDisplayData {
    imageUrl: string;
    hotspots: Hotspot[];
}

// Define the return type of the hook - ADD addHotspot
interface UseMapNavigationReturn {
    currentMapId: string | null;
    currentMapDisplayData: MapDisplayData | null;
    navigateToChild: (childMapId: string) => void;
    navigateBack: () => void;
    canGoBack: boolean;
    error: string | null;
    addHotspot: (newHotspot: Hotspot) => void; // New function signature
}

// Cast the imported JSON to our defined type for type safety
const originalMapData: MapCollection = mapDataSource as MapCollection;

// The custom hook implementation using local JSON data
export const useMapNavigation = (initialMapId: string): UseMapNavigationReturn => {
    // --- State for Managed Map Data ---
    // Initialize with a deep copy to allow modification without mutating the import
    const [managedMapData, setManagedMapData] = useState<MapCollection>(() => JSON.parse(JSON.stringify(originalMapData)));

    const [currentMapId, setCurrentMapId] = useState<string | null>(null);
    const [currentMapDisplayData, setCurrentMapDisplayData] = useState<MapDisplayData | null>(null);
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // --- Function to get map data from the MANAGED state ---
    const getMapDataById = useCallback((mapId: string): MapDisplayData | null => {
        // Read from the managed state, not the original import
        const mapDef = managedMapData[mapId];
        if (mapDef) {
            return {
                imageUrl: mapDef.imageUrl,
                hotspots: mapDef.hotspots, // Return the current hotspots from state
            };
        }
        console.error(`Map data not found for ID: ${mapId}`);
        setError(`Map data not found for ID: ${mapId}`);
        return null;
    }, [managedMapData]); // Dependency on managedMapData

    // Effect to load the initial map
    useEffect(() => {
        setError(null);
        // Reset managed data if initialMapId changes drastically (optional)
        // setManagedMapData(JSON.parse(JSON.stringify(originalMapData)));
        const initialData = getMapDataById(initialMapId);
        if (initialData) {
            setCurrentMapId(initialMapId);
            setCurrentMapDisplayData(initialData);
            setNavigationHistory([]);
        } else {
            setCurrentMapId(null);
            setCurrentMapDisplayData(null);
            setNavigationHistory([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMapId]); // Rerun only if initialMapId changes, getMapDataById is stable unless managedMapData changes

    // --- Update currentMapDisplayData when managedMapData changes for the current map ---
    useEffect(() => {
        if (currentMapId) {
            const currentData = getMapDataById(currentMapId);
            setCurrentMapDisplayData(currentData);
        }
    }, [managedMapData, currentMapId, getMapDataById]);


    const navigateToChild = useCallback((childMapId: string) => {
        if (!currentMapId) return;
        setError(null);
        const childData = getMapDataById(childMapId); // Uses managed data
        if (childData) {
            setNavigationHistory(prevHistory => [...prevHistory, currentMapId]);
            setCurrentMapId(childMapId);
            // setCurrentMapDisplayData(childData); // This will be updated by the useEffect above
        }
    }, [currentMapId, getMapDataById]);

    const navigateBack = useCallback(() => {
        if (navigationHistory.length === 0) return;
        setError(null);
        const parentMapId = navigationHistory[navigationHistory.length - 1];
        const parentData = getMapDataById(parentMapId); // Uses managed data
        if (parentData) {
            setCurrentMapId(parentMapId);
            // setCurrentMapDisplayData(parentData); // This will be updated by the useEffect above
            setNavigationHistory(prevHistory => prevHistory.slice(0, -1));
        } else {
            console.error(`Error navigating back: Parent map data (${parentMapId}) not found.`);
            setError(`Error navigating back: Parent map data (${parentMapId}) not found.`);
        }
    }, [navigationHistory, getMapDataById]);

    // --- Function to Add a Hotspot to the Current Map's Data ---
    const addHotspot = useCallback((newHotspot: Hotspot) => {
        if (!currentMapId) {
            console.error("Cannot add hotspot: No current map selected.");
            setError("Cannot add hotspot: No current map selected.");
            return;
        }

        setManagedMapData(prevMapData => {
            const currentMapDef = prevMapData[currentMapId];
            if (!currentMapDef) {
                console.error(`Cannot add hotspot: Map definition not found for ${currentMapId}`);
                setError(`Cannot add hotspot: Map definition not found for ${currentMapId}`);
                return prevMapData; // Return previous state if map not found
            }

            // Create a new map data object with the updated hotspots array (IMMUTABILITY)
            const updatedMapDef = {
                ...currentMapDef,
                hotspots: [...currentMapDef.hotspots, newHotspot], // Add new hotspot
            };

            // Create a new overall map collection state
            const nextMapData = {
                ...prevMapData,
                [currentMapId]: updatedMapDef, // Update the specific map definition
            };

            return nextMapData;
        });

        // Note: The useEffect watching managedMapData will update currentMapDisplayData
        setError(null); // Clear any previous errors

    }, [currentMapId]); // Dependency on currentMapId

    const canGoBack = navigationHistory.length > 0;

    return {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspot, // Export the new function
    };
};
