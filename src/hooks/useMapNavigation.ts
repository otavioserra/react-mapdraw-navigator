// src/hooks/useMapNavigation.ts
import { useState, useEffect, useCallback } from 'react';
import mapDataSource from '../data/map-data.json';

// --- Type Definitions ---

/** Defines the properties of a clickable area on a map. */
export interface Hotspot {
    /** Unique identifier for the hotspot. */
    id: string;
    /** X-coordinate of the top-left corner. */
    x: number;
    /** Y-coordinate of the top-left corner. */
    y: number;
    /** Width of the hotspot area. */
    width: number;
    /** Height of the hotspot area. */
    height: number;
    /** ID of the map this hotspot links to. */
    link_to_map_id: string;
}

/** Defines the structure of a single map's data. */
export interface MapDefinition {
    /** URL of the background image for the map. */
    imageUrl: string;
    /** Array of hotspots present on this map. */
    hotspots: Hotspot[];
}

/** Represents the entire collection of maps, keyed by their unique ID. */
export type MapCollection = Record<string, MapDefinition>;

/** Data structure used for displaying the current map in the UI. */
export interface MapDisplayData {
    /** URL of the background image for the current map. */
    imageUrl: string;
    /** Array of hotspots for the current map. */
    hotspots: Hotspot[];
}

/** Possible actions while in edit mode */
export type EditAction = 'none' | 'adding' | 'selecting_for_deletion' | 'changing_root_image';

/** Defines the structure of the object returned by the useMapNavigation hook. */
interface UseMapNavigationReturn {
    /** The ID of the currently displayed map, or null if none is loaded. */
    currentMapId: string | null;
    /** Data needed to render the current map (image URL and hotspots), or null. */
    currentMapDisplayData: MapDisplayData | null;
    /** Function to navigate to a map linked by a hotspot. */
    navigateToChild: (childMapId: string) => void;
    /** Function to navigate to the previous map in the history stack. */
    navigateBack: () => void;
    /** Boolean flag indicating if backward navigation is possible (history is not empty). */
    canGoBack: boolean;
    /** Stores any error message encountered during operation, or null if no error. */
    error: string | null;
    /** Function to add a new hotspot to a target map and define the new map it links to. */
    addHotspotAndMapDefinition: (targetMapId: string, newHotspot: Hotspot, newMapImageUrl: string) => void;
    /** The current, managed state of all map data (including additions/deletions). */
    managedMapData: MapCollection;
    /** Function to delete a specific hotspot from a target map. */
    deleteHotspot: (targetMapId: string, hotspotIdToDelete: string) => void;
    editAction: EditAction; // The current action being performed in edit mode
    setEditAction: React.Dispatch<React.SetStateAction<EditAction>>; // Function to change the edit action
    loadNewMapData: (jsonString: string) => void; // Function to load new data set
}

/** Fallback map data loaded from the imported JSON file. */
const originalMapData: MapCollection = mapDataSource as MapCollection;

/**
 * Custom hook to manage navigation and state for an interactive map composed of linked images and hotspots.
 * Handles loading initial data, navigation history, adding/deleting hotspots, and managing map definitions.
 *
 * @param initialMapId The ID of the map to display initially.
 * @param initialDataJsonString Optional JSON string containing initial map data to override the default file data.
 * @returns An object containing the current map state, navigation functions, modification functions, and error status.
 */
export const useMapNavigation = (
    initialMapId: string,
    initialDataJsonString?: string
): UseMapNavigationReturn => {

    // Determine the initial map data source (provided JSON string or fallback file)
    let initialMapData: MapCollection = originalMapData;
    if (initialDataJsonString && initialDataJsonString.trim().length > 0) {
        try {
            const parsedData = JSON.parse(initialDataJsonString);
            if (typeof parsedData === 'object' && parsedData !== null) {
                initialMapData = parsedData as MapCollection;
            }
        } catch (error) {
            console.error("Failed to parse initialDataJsonString. Falling back to file data. Error:", error);
        }
    }

    /** State holding the complete, potentially modified, map data collection. */
    const [managedMapData, setManagedMapData] = useState<MapCollection>(() =>
        JSON.parse(JSON.stringify(initialMapData)) // Initialize with a deep copy
    );

    /** State for the ID of the map currently being displayed. */
    const [currentMapId, setCurrentMapId] = useState<string | null>(null);
    /** State for the data needed to render the current map in the UI. */
    const [currentMapDisplayData, setCurrentMapDisplayData] = useState<MapDisplayData | null>(null);
    /** State holding the stack of visited map IDs for back navigation. */
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    /** State for storing error messages. */
    const [error, setError] = useState<string | null>(null);
    /** State for the current edit action */
    const [editAction, setEditAction] = useState<EditAction>('none');

    /**
     * Retrieves the display data (imageUrl, hotspots) for a given map ID from the managed state.
     * Sets an error if the map ID is not found.
     * @param mapId The ID of the map to retrieve data for.
     * @returns The MapDisplayData if found, otherwise null.
     */
    const getMapDataById = useCallback((mapId: string | null): MapDisplayData | null => {
        if (!mapId) return null;
        const mapDef = managedMapData[mapId];
        if (mapDef) {
            return { imageUrl: mapDef.imageUrl, hotspots: mapDef.hotspots };
        }
        const errorMsg = `Error loading map: Map data not found for ID: '${mapId}'`;
        console.error(errorMsg);
        setError(errorMsg);
        return null;
    }, [managedMapData]); // Recalculate only if managedMapData changes

    /** Effect to load the initial map when the hook mounts or initialMapId changes. */
    useEffect(() => {
        setError(null);
        const dataForId = getMapDataById(initialMapId);
        if (dataForId) {
            setCurrentMapId(initialMapId);
            setCurrentMapDisplayData(dataForId);
            setNavigationHistory([]); // Reset history on initial load
        } else {
            // Error is set within getMapDataById if not found
            setCurrentMapId(null);
            setCurrentMapDisplayData(null);
            setNavigationHistory([]);
        }
    }, [initialMapId]); // Rerun if initialMapId or the getter function changes

    /** Effect to update the display data if the underlying managedMapData changes while a map is displayed. */
    useEffect(() => {
        if (currentMapId) {
            const currentData = managedMapData[currentMapId];
            if (currentData) {
                // Ensure the currently displayed map data is up-to-date
                setCurrentMapDisplayData({
                    imageUrl: currentData.imageUrl,
                    hotspots: currentData.hotspots,
                });
            } else {
                // Handle cases where the current map might have been deleted externally
                const errorMsg = `Inconsistency detected: Current map ID '${currentMapId}' no longer exists in data.`;
                console.error(errorMsg);
                setError(errorMsg);
                // Consider resetting navigation state here if appropriate
            }
        }
    }, [managedMapData, currentMapId]); // Rerun if map data or current map ID changes

    /**
     * Navigates to a new map specified by its ID.
     * Pushes the current map ID onto the history stack.
     * @param childMapId The ID of the map to navigate to.
     */
    const navigateToChild = useCallback((childMapId: string) => {
        // Basic validation to prevent navigating with invalid IDs (e.g., URLs)
        if (typeof childMapId !== 'string' || childMapId.includes('://') || childMapId.includes('/')) {
            const errorMsg = `Navigation failed: Invalid format for target map ID: '${childMapId}'. Expected a valid key.`;
            console.warn(errorMsg);
            setError(errorMsg);
            return;
        }
        if (!currentMapId) return; // Cannot navigate from a null state

        const childDataExists = managedMapData[childMapId];
        if (childDataExists) {
            setError(null);
            setNavigationHistory(prevHistory => [...prevHistory, currentMapId]);
            setCurrentMapId(childMapId); // Display data updates via the useEffect hook
        } else {
            const errorMsg = `Navigation failed: Target map ID '${childMapId}' not found in map data.`;
            console.warn(errorMsg);
            setError(errorMsg);
        }
    }, [currentMapId, managedMapData, setNavigationHistory, setCurrentMapId, setError]); // Dependencies needed for the logic

    /** Navigates back to the previously visited map based on the navigation history. */
    const navigateBack = useCallback(() => {
        if (navigationHistory.length === 0) return; // Cannot go back if history is empty

        const parentMapId = navigationHistory[navigationHistory.length - 1];
        const parentDataExists = managedMapData[parentMapId]; // Check if parent map still exists

        if (parentDataExists) {
            setError(null);
            setCurrentMapId(parentMapId);
            setNavigationHistory(prevHistory => prevHistory.slice(0, -1)); // Pop the last entry
        } else {
            // Defensive check in case the map data changed and history points to a deleted map
            const errorMsg = `Error navigating back: Parent map ID '${parentMapId}' from history not found in current map data. History might be corrupted.`;
            console.error(errorMsg);
            setError(errorMsg);
            // Optionally, clear the invalid history entry or take other recovery steps
        }
    }, [navigationHistory, managedMapData, setNavigationHistory, setCurrentMapId, setError]); // Dependencies needed

    /**
     * Adds a new hotspot to a specified map and simultaneously defines the new map
     * that this hotspot links to within the managed map data.
     * @param targetMapId ID of the map where the hotspot will be added.
     * @param newHotspot The hotspot object to add (contains its own ID and link_to_map_id).
     * @param newMapImageUrl URL for the image of the *new* map being created/defined.
     */
    const addHotspotAndMapDefinition = useCallback(
        (targetMapId: string, newHotspot: Hotspot, newMapImageUrl: string) => {
            setError(null);
            setManagedMapData(prevMapData => {
                const newMapData = JSON.parse(JSON.stringify(prevMapData)); // Deep copy
                const targetMapDef = newMapData[targetMapId];

                if (!targetMapDef) {
                    const errorMsg = `Cannot add hotspot: Target map definition not found for ID '${targetMapId}'`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return prevMapData; // Return original data on error
                }

                // Add the hotspot to the target map
                targetMapDef.hotspots.push(newHotspot);

                // Define the new map linked by the hotspot
                const newMapDefinitionId = newHotspot.link_to_map_id;
                if (newMapData[newMapDefinitionId]) {
                    // Prevent overwriting an existing map accidentally
                    const errorMsg = `Consistency Error: Map ID '${newMapDefinitionId}' already exists. Cannot add new definition.`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    // Return data with only the hotspot added, but not the new map definition
                    // Alternatively, return prevMapData to abort the whole operation. Let's return modified data.
                    return newMapData;
                }

                newMapData[newMapDefinitionId] = {
                    imageUrl: newMapImageUrl,
                    hotspots: [] // New map starts with no hotspots
                };

                return newMapData; // Return the updated structure
            });
        },
        [setManagedMapData, setError] // Dependencies: state setters
    );

    /**
     * Deletes a specific hotspot from a target map.
     * @param targetMapId The ID of the map containing the hotspot.
     * @param hotspotIdToDelete The ID of the hotspot to remove.
     */
    const deleteHotspot = useCallback(
        (targetMapId: string, hotspotIdToDelete: string) => {
            setError(null);
            setManagedMapData(prevMapData => {
                const newMapData = JSON.parse(JSON.stringify(prevMapData)); // Deep copy
                const targetMapDef = newMapData[targetMapId];

                if (!targetMapDef) {
                    const errorMsg = `Erro ao deletar hotspot: Mapa alvo não encontrado para ID '${targetMapId}'`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return prevMapData;
                }

                // Find the specific hotspot object *before* filtering the array
                const hotspotToDelete = targetMapDef.hotspots.find((hs: Hotspot) => hs.id === hotspotIdToDelete);
                const linkedMapId = hotspotToDelete?.link_to_map_id; // Get the ID it potentially links to

                const initialHotspotCount = targetMapDef.hotspots.length;
                targetMapDef.hotspots = targetMapDef.hotspots.filter(
                    (hotspot: Hotspot) => hotspot.id !== hotspotIdToDelete
                );

                if (targetMapDef.hotspots.length === initialHotspotCount) {
                    const errorMsg = `Aviso: Hotspot com ID '${hotspotIdToDelete}' não encontrado no mapa '${targetMapId}'. Nenhuma alteração feita.`;
                    console.warn(errorMsg);
                    // Not setting global error state for a warning/non-critical issue
                    return prevMapData; // No change, return previous data
                }

                // NEW: Orphaned Map Deletion Logic (Simplified)
                if (linkedMapId && newMapData[linkedMapId]) { // Check if linked map exists
                    let isLinkedElsewhere = false;
                    // Iterate through ALL maps and ALL their hotspots in the *new* data state
                    for (const mapId in newMapData) {
                        // Check only if the map definition and hotspots array exist
                        if (newMapData[mapId]?.hotspots) {
                            for (const hs of newMapData[mapId].hotspots) {
                                // Check if any *other* hotspot still links to the same map ID
                                if (hs.link_to_map_id === linkedMapId) {
                                    isLinkedElsewhere = true;
                                    break; // Found a link, no need to check further in this map
                                }
                            }
                        }
                        if (isLinkedElsewhere) break; // Stop searching maps if found
                    }

                    // If no other hotspot links to it, delete the map definition
                    if (!isLinkedElsewhere) {
                        delete newMapData[linkedMapId]; // Delete the map entry
                        // NOTE: This is the simplified version. It doesn't recursively check further orphans.
                    }
                }

                return newMapData; // Return updated data
            });
        },
        [setManagedMapData, setError] // Dependencies: state setters
    );

    /** Boolean flag derived from navigation history state. */
    const canGoBack = navigationHistory.length > 0;

    // Re-add this entire function definition block
    /**
     * Loads a completely new map data structure from a JSON string,
     * replacing the current state. Resets navigation.
     * @param jsonString The JSON string containing the new MapCollection data.
     */
    const loadNewMapData = useCallback((jsonString: string) => {
        try {
            const parsedData = JSON.parse(jsonString);
            if (typeof parsedData === 'object' && parsedData !== null && Object.keys(parsedData).length > 0) {
                const newRootId = Object.keys(parsedData)[0];
                if (!newRootId || !parsedData[newRootId]) {
                    console.error("Failed to load new data: Could not determine a valid root map ID from the JSON.");
                    setError("Failed to load new data: Invalid structure or missing root map.");
                    return;
                }
                setManagedMapData(parsedData as MapCollection);
                setCurrentMapId(newRootId);
                setCurrentMapDisplayData({
                    imageUrl: parsedData[newRootId].imageUrl,
                    hotspots: parsedData[newRootId].hotspots
                });
                setNavigationHistory([]);
                setError(null);
                setEditAction('none');
            } else {
                console.error("Failed to load new data: Parsed data is not a valid non-empty object.");
                setError("Failed to load new data: Invalid JSON structure.");
            }
        } catch (err) {
            console.error("Failed to parse JSON string for loading new map data:", err);
            setError("Failed to load new data: Invalid JSON format.");
        }
    }, []);

    // Return the public API of the hook
    return {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspotAndMapDefinition,
        managedMapData, // Expose managed data for potential saving/exporting
        deleteHotspot,
        editAction,     // Expose the current edit action state
        setEditAction,  // Expose the function to set the edit action
        loadNewMapData,
    };
};