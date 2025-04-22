// src/hooks/useMapNavigation.ts
import { useState, useEffect, useCallback } from 'react';
// Import the static JSON data directly - this will be our fallback.
import mapDataSource from '../data/map-data.json';

// --- Type Definitions ---
export interface Hotspot {
    id: string;
    x: number; // Assuming these are percentages
    y: number;
    width: number;
    height: number;
    link_to_map_id: string; // ID of the map this hotspot links to
}

// --- CORRECTED: Ensure imageUrl is part of the definition ---
export interface MapDefinition {
    imageUrl: string; // <<< CORRECTION APPLIED: The URL of the map image
    hotspots: Hotspot[]; // Array of hotspots defined for this map
}
// --- End of Correction ---

// Represents the entire collection of maps, keyed by their unique ID
export type MapCollection = Record<string, MapDefinition>;

// Data structure used for displaying the current map in the UI
export interface MapDisplayData {
    imageUrl: string;
    hotspots: Hotspot[];
}

// Defines the structure of the object returned by the useMapNavigation hook
interface UseMapNavigationReturn {
    currentMapId: string | null; // The ID of the currently displayed map
    currentMapDisplayData: MapDisplayData | null; // Data needed to render the current map
    navigateToChild: (childMapId: string) => void; // Function to navigate to a linked map
    navigateBack: () => void; // Function to navigate to the previous map in history
    canGoBack: boolean; // Flag indicating if backward navigation is possible
    error: string | null; // Stores any error message during navigation or data loading
    // Function to add a new hotspot to a map AND define the new map it links to
    addHotspotAndMapDefinition: (targetMapId: string, newHotspot: Hotspot, newMapImageUrl: string) => void;
    managedMapData: MapCollection; // The current state of all map data (including additions)
}

// Cast the imported JSON to our defined type for type safety - This is the fallback data
const originalMapData: MapCollection = mapDataSource as MapCollection;

// The custom hook implementation
export const useMapNavigation = (
    initialMapId: string, // The ID of the map to load initially
    initialDataJsonString?: string // Optional: A JSON string containing initial map data
): UseMapNavigationReturn => {

    // --- Determine the initial map data source ---
    let initialMapData: MapCollection = originalMapData; // Default to file data

    if (initialDataJsonString && initialDataJsonString.trim().length > 0) {
        console.log("Attempting to use provided initialDataJsonString...");
        try {
            const parsedData = JSON.parse(initialDataJsonString);
            // Basic validation: check if it's a non-null object
            if (typeof parsedData === 'object' && parsedData !== null) {
                initialMapData = parsedData as MapCollection; // Use parsed data
                console.log("Successfully parsed and using inline JSON data.");
            } else {
                console.warn("Provided initialDataJsonString parsed, but is not a valid object. Falling back to file data.");
            }
        } catch (error) {
            console.error("Failed to parse initialDataJsonString. Falling back to file data. Error:", error);
        }
    }
    // --- End of data source determination ---

    // --- State for Managed Map Data ---
    // Initialize with a deep copy of the DETERMINED initial data to allow modification
    const [managedMapData, setManagedMapData] = useState<MapCollection>(() =>
        JSON.parse(JSON.stringify(initialMapData))
    );

    // --- State Variables ---
    const [currentMapId, setCurrentMapId] = useState<string | null>(null); // ID of the map currently shown
    const [currentMapDisplayData, setCurrentMapDisplayData] = useState<MapDisplayData | null>(null); // Data for the UI
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]); // Stack of visited map IDs
    const [error, setError] = useState<string | null>(null); // Error message state

    // --- Helper Function to Get Map Data by ID (Handles Errors) ---
    const getMapDataById = useCallback((mapId: string | null): MapDisplayData | null => {
        if (!mapId) return null; // Handle null/undefined ID early
        const mapDef = managedMapData[mapId]; // Look up in the current state
        if (mapDef) {
            // Map found, return display data (imageUrl now exists due to interface correction)
            return { imageUrl: mapDef.imageUrl, hotspots: mapDef.hotspots };
        }
        // Map not found, set error state and return null
        const errorMsg = `Error loading map: Map data not found for ID: '${mapId}'`;
        console.error(errorMsg);
        setError(errorMsg);
        return null;
    }, [managedMapData]); // Depends on the current map data state

    // --- Effect for Initial Map Load ---
    useEffect(() => {
        setError(null); // Clear previous errors on initial load attempt
        const dataForId = getMapDataById(initialMapId); // Try to get data for the initial ID
        if (dataForId) {
            // Success: Set current map ID, display data, and reset history
            setCurrentMapId(initialMapId);
            setCurrentMapDisplayData(dataForId);
            setNavigationHistory([]);
        } else {
            // Failure: getMapDataById already set the error. Reset state.
            setCurrentMapId(null);
            setCurrentMapDisplayData(null);
            setNavigationHistory([]);
        }
    }, [initialMapId, getMapDataById]); // Rerun if initialMapId changes

    // --- Effect to Update Display Data if managedMapData Changes ---
    // (e.g., after adding a hotspot/map)
    useEffect(() => {
        if (currentMapId) {
            const currentData = managedMapData[currentMapId]; // Direct lookup in state
            if (currentData) {
                // Update display data if current map still exists
                setCurrentMapDisplayData({
                    imageUrl: currentData.imageUrl, // imageUrl exists due to correction
                    hotspots: currentData.hotspots,
                });
            } else {
                // Handle inconsistency if currentMapId becomes invalid after load
                const errorMsg = `Inconsistency detected: Current map ID '${currentMapId}' no longer exists in data.`;
                console.error(errorMsg);
                setError(errorMsg);
                // Optionally reset state here
            }
        }
    }, [managedMapData, currentMapId]); // Depends on data state and current ID

    // --- Navigation Functions ---
    const navigateToChild = useCallback((childMapId: string) => {
        // Basic validation for ID format (optional)
        if (typeof childMapId !== 'string' || childMapId.includes('://') || childMapId.includes('/')) {
            const errorMsg = `Navigation failed: Invalid format for target map ID: '${childMapId}'. Expected a valid key.`;
            console.warn(errorMsg);
            setError(errorMsg);
            return;
        }
        if (!currentMapId) return; // Safety check

        const childDataExists = managedMapData[childMapId]; // Check if target exists
        if (childDataExists) {
            // Success: Clear error, update history, set new current ID
            setError(null);
            setNavigationHistory(prevHistory => [...prevHistory, currentMapId]);
            setCurrentMapId(childMapId); // Display data updates via useEffect
        } else {
            // Failure: Set error, do not navigate
            const errorMsg = `Navigation failed: Target map ID '${childMapId}' not found in map data.`;
            console.warn(errorMsg);
            setError(errorMsg);
        }
    }, [currentMapId, managedMapData]);

    const navigateBack = useCallback(() => {
        if (navigationHistory.length === 0) return; // Cannot go back

        const parentMapId = navigationHistory[navigationHistory.length - 1];
        const parentDataExists = managedMapData[parentMapId]; // Check if parent still exists

        if (parentDataExists) {
            // Success: Clear error, set parent ID as current, pop history
            setError(null);
            setCurrentMapId(parentMapId);
            setNavigationHistory(prevHistory => prevHistory.slice(0, -1)); // Display data updates via useEffect
        } else {
            // Failure (History points to a non-existent map - defensive)
            const errorMsg = `Error navigating back: Parent map ID '${parentMapId}' from history not found in current map data. History might be corrupted.`;
            console.error(errorMsg);
            setError(errorMsg);
            // Optionally clear the bad history entry or reset further
        }
    }, [navigationHistory, managedMapData]);


    // --- Function to Add Hotspot AND Define the New Map it Links To ---
    const addHotspotAndMapDefinition = useCallback(
        (targetMapId: string, newHotspot: Hotspot, newMapImageUrl: string) => {
            // targetMapId: ID of the map where the hotspot is being added (e.g., 'rootMap')
            // newHotspot: The hotspot object itself (contains its own ID and link_to_map_id)
            // newMapImageUrl: URL for the image of the NEW map being created

            setError(null); // Clear previous errors on attempt

            setManagedMapData(prevMapData => {
                // --- Perform a deep copy for immutability ---
                // Consider structuredClone() for modern browsers or lodash.cloneDeep for broader support if performance is critical
                const newMapData = JSON.parse(JSON.stringify(prevMapData));

                // --- 1. Add the Hotspot to the target map's definition ---
                const targetMapDef = newMapData[targetMapId];
                if (!targetMapDef) {
                    const errorMsg = `Cannot add hotspot: Target map definition not found for ID '${targetMapId}'`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return prevMapData; // Return original data on error
                }
                targetMapDef.hotspots.push(newHotspot); // Add the hotspot object

                // --- 2. Add the New Map Definition ---
                const newMapDefinitionId = newHotspot.link_to_map_id; // Get the ID for the new map from the hotspot link

                // Defensive check (should have been validated in Mapdraw)
                if (newMapData[newMapDefinitionId]) {
                    const errorMsg = `Consistency Error: Map ID '${newMapDefinitionId}' already exists before adding definition.`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return newMapData; // Avoid overwriting existing map
                }

                // Create the new map definition entry using the new ID as the key
                newMapData[newMapDefinitionId] = {
                    imageUrl: newMapImageUrl, // Use the provided image URL
                    hotspots: []             // Initialize with an empty hotspots array
                };

                console.log(`Updated map data: Added hotspot to '${targetMapId}', Added map definition for '${newMapDefinitionId}'`);
                return newMapData; // Return the fully updated map data structure
            });
        },
        [] // No dependencies needed if it only relies on arguments and setManagedMapData
    );


    const canGoBack = navigationHistory.length > 0; // Check if history is not empty

    // --- Return values of the hook ---
    return {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspotAndMapDefinition, // Return the combined function
        managedMapData, // Return the current data state (for export, etc.)
    };
};
