// src/hooks/useMapNavigation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import mapDataSource from '../data/map-data.json';

// --- Type Definitions ---

export type HotspotLinkType = 'map' | 'url';
export type HotspotUrlTarget = '_self' | '_blank';

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
    title?: string;
    linkType: HotspotLinkType;      // This will be 'map' or 'url' after normalization.
    link_to_map_id?: string;   // Should only be present if linkType is 'map'.
    // linkedMapId?: string; // This was a remnant, link_to_map_id is used for map links.
    linkedUrl?: string;
    urlTarget?: HotspotUrlTarget;
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
export type EditAction = 'none' | 'adding' | 'selecting_for_deletion' | 'changing_root_image' | 'editing_hotspot' | 'selecting_for_edit';

/** Data structure for storing transform state of a map view. */
export interface MapViewTransform {
    scale: number;
    x: number;
    y: number;
}

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
    updateMapImageUrl: (mapId: string, newImageUrl: string) => void;
    updateHotspotDetails: (targetMapId: string, hotspotIdToUpdate: string, newDetails: Partial<Omit<Hotspot, 'id' | 'x' | 'y' | 'width' | 'height'>>) => void; // Function to update hotspot details
    /** Stores the transform state (zoom/pan) for each map ID. */
    mapViewTransforms: Record<string, MapViewTransform>;
    updateMapViewTransform: (mapId: string, transform: MapViewTransform) => void;
}

// Helper function to normalize loaded map data
const normalizeMapData = (data: Record<string, any>): MapCollection => {
    const normalizedData: MapCollection = {};
    for (const mapId in data) {
        if (Object.prototype.hasOwnProperty.call(data, mapId)) {
            const mapDef = data[mapId];
            normalizedData[mapId] = {
                imageUrl: mapDef.imageUrl, // Ensure imageUrl is directly assigned
                hotspots: (mapDef.hotspots || []).map((hs: any) => {
                    let determinedLinkType = hs.linkType;
                    if (!determinedLinkType) { // Infer linkType if not present
                        if (hs.link_to_map_id) {
                            determinedLinkType = 'map';
                        } else if (hs.linkedUrl) { // For future-proofing if data might come with linkedUrl but no type
                            determinedLinkType = 'url';
                        }
                    }

                    const normalizedHotspot: Partial<Hotspot> = {
                        // Spread existing properties like id, x, y, width, height, title
                        id: hs.id,
                        x: hs.x,
                        y: hs.y,
                        width: hs.width,
                        height: hs.height,
                        title: hs.title,
                        linkType: determinedLinkType as HotspotLinkType,
                    };

                    if (determinedLinkType === 'map') {
                        normalizedHotspot.link_to_map_id = hs.link_to_map_id;
                    } else if (determinedLinkType === 'url') {
                        normalizedHotspot.linkedUrl = hs.linkedUrl;
                        normalizedHotspot.urlTarget = hs.urlTarget || '_blank'; // Default target if not specified
                    }

                    return normalizedHotspot as Hotspot; // Cast after building
                }).filter((hs: Hotspot | undefined): hs is Hotspot => !!hs && !!hs.linkType) // Filter out hotspots that couldn't be normalized to a valid linkType
            };
        }
    }
    return normalizedData;
};

/**
 * Custom hook to manage navigation and state for an interactive map composed of linked images and hotspots.
 * Handles loading initial data, navigation history, adding/deleting hotspots, and managing map definitions.
 *
 * @param initialRootMapId The ID of the map to display initially.
 * @param initialDataJsonString Optional JSON string containing initial map data to override the default file data.
 * @returns An object containing the current map state, navigation functions, modification functions, and error status.
 */
export const useMapNavigation = (
    initialRootMapId: string,
    initialDataJsonString?: string
): UseMapNavigationReturn => {
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
    /** State to store zoom/pan transforms for each map. */
    const [mapViewTransforms, setMapViewTransforms] = useState<Record<string, MapViewTransform>>({});

    /** State holding the complete, potentially modified, map data collection. */
    const [managedMapData, setManagedMapData] = useState<MapCollection>(() => {
        let dataToNormalize: any = mapDataSource; // Default to file data
        if (initialDataJsonString && initialDataJsonString.trim().length > 0) {
            try {
                const parsedData = JSON.parse(initialDataJsonString);
                if (typeof parsedData === 'object' && parsedData !== null) {
                    dataToNormalize = parsedData;
                } else {
                    console.warn("initialDataJsonString parsed to a non-object. Using file data.");
                }
            } catch (parseError) {
                console.error("Failed to parse initialDataJsonString. Falling back to file data. Error:", parseError);
            }
        }
        const normalizedInitialData = normalizeMapData(dataToNormalize);
        return JSON.parse(JSON.stringify(normalizedInitialData)); // Initialize with a deep copy of normalized data
    });

    // Ref to store the previous initialRootMapId to detect actual prop changes
    const prevInitialRootMapIdRef = useRef<string | null>(null);

    /**
     * Effect to load the map specified by `initialRootMapId` when the hook mounts
     * or when the `initialRootMapId` prop itself changes.
     * This should not reset to the root map if `managedMapData` changes for other reasons
     * (e.g., adding a hotspot to a non-root map).
     */
    useEffect(() => {
        setError(null);

        // Reset to initialRootMapId if:
        // 1. It's the very first load (currentMapId is null).
        // 2. OR the initialRootMapId prop has actually changed to a new valid map ID.
        if (currentMapId === null || (initialRootMapId !== prevInitialRootMapIdRef.current)) {
            const targetMapDef = managedMapData[initialRootMapId];
            if (targetMapDef) {
                setCurrentMapId(initialRootMapId);
                setCurrentMapDisplayData({ imageUrl: targetMapDef.imageUrl, hotspots: targetMapDef.hotspots });
                setNavigationHistory([]);
                // console.log(`useMapNavigation: Set current map to initial/new root: ${initialRootMapId}`);
            } else {
                const errorMsg = `Error loading initial map: Map data not found for ID: '${initialRootMapId}' in current map data.`;
                console.error(errorMsg, 'Current managedMapData keys:', Object.keys(managedMapData));
                setError(errorMsg);
                setCurrentMapId(null);
                setCurrentMapDisplayData(null);
                setNavigationHistory([]);
            }
        }
        // Update the ref *after* the logic for the current render has run.
        prevInitialRootMapIdRef.current = initialRootMapId;

    }, [initialRootMapId, managedMapData, currentMapId]); // currentMapId is added to allow the initial check (currentMapId === null)
    // managedMapData is needed as targetMapDef is read from it.
    // initialRootMapId is the primary driver for this effect.

    /** Effect to update the display data if the underlying managedMapData changes while a map is displayed. */
    useEffect(() => {
        if (currentMapId) {
            const currentData = managedMapData[currentMapId];
            if (currentData) {
                setCurrentMapDisplayData({
                    imageUrl: currentData.imageUrl,
                    hotspots: [...currentData.hotspots],
                });
            } else {
                // Current map ID is no longer valid in managedMapData (e.g., deleted)
                console.warn(`Current map ID '${currentMapId}' no longer found in managed data. Clearing display.`);
                setCurrentMapDisplayData(null);
            }
        } else {
            setCurrentMapDisplayData(null);
        }
    }, [managedMapData, currentMapId]); // setCurrentMapDisplayData is stable and can be omitted

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
                // Only create a new map definition if linkType is 'map', a link_to_map_id is provided,
                // and an image URL for the new map is also provided.
                if (newHotspot.linkType === 'map' && newHotspot.link_to_map_id && newMapImageUrl) {
                    const newMapDefinitionId = newHotspot.link_to_map_id;
                    if (newMapData[newMapDefinitionId]) {
                        // Prevent overwriting an existing map accidentally
                        const errorMsg = `Consistency Error: Map ID '${newMapDefinitionId}' already exists. Cannot add new definition.`;
                        console.error(errorMsg);
                        setError(errorMsg);
                        // Return data with only the hotspot added, but not the new map definition
                        return newMapData;
                    }

                    newMapData[newMapDefinitionId] = {
                        imageUrl: newMapImageUrl,
                        hotspots: [] // New map starts with no hotspots
                    };
                } else if (newHotspot.linkType === 'map' && !newMapImageUrl) {
                    console.warn(`Attempted to add a 'map' link hotspot without providing an image URL for the new map '${newHotspot.link_to_map_id}'. New map definition will not be created.`);
                }
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
                // Get the ID it potentially links to, only if it's a map link
                const linkedMapId = hotspotToDelete?.linkType === 'map' ? hotspotToDelete?.link_to_map_id : undefined;

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
                                if (hs.linkType === 'map' && hs.link_to_map_id === linkedMapId) {
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
            const normalizedNewData = normalizeMapData(parsedData); // Normalize the new data

            if (typeof normalizedNewData === 'object' && normalizedNewData !== null && Object.keys(normalizedNewData).length > 0) {
                const newRootId = Object.keys(normalizedNewData)[0];
                if (!newRootId || !normalizedNewData[newRootId]) {
                    console.error("Failed to load new data: Could not determine a valid root map ID from the JSON.");
                    setError("Failed to load new data: Invalid structure or missing root map.");
                    return;
                }
                setManagedMapData(normalizedNewData);
                setCurrentMapId(newRootId);
                setCurrentMapDisplayData({
                    imageUrl: normalizedNewData[newRootId].imageUrl,
                    hotspots: normalizedNewData[newRootId].hotspots
                });
                setNavigationHistory([]);
                setError(null);
                setEditAction('none');
                setMapViewTransforms({}); // Reset stored transforms for the new dataset
            } else {
                console.error("Failed to load new data: Parsed data is not a valid non-empty object.");
                setError("Failed to load new data: Invalid JSON structure.");
            }
        } catch (err) {
            console.error("Failed to parse JSON string for loading new map data:", err);
            setError("Failed to load new data: Invalid JSON format.");
        }
    }, []);

    const updateHotspotDetails = useCallback(
        (targetMapId: string, hotspotIdToUpdate: string, newDetails: Partial<Omit<Hotspot, 'id' | 'x' | 'y' | 'width' | 'height'>>) => {
            setError(null);
            setManagedMapData(prevMapData => {
                const newMapData = JSON.parse(JSON.stringify(prevMapData));
                const mapDef = newMapData[targetMapId];

                if (!mapDef || !mapDef.hotspots) {
                    const errorMsg = `Cannot update hotspot: Map definition or hotspots array not found for ID '${targetMapId}'`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return prevMapData;
                }

                const hotspotIndex = mapDef.hotspots.findIndex((hs: Hotspot) => hs.id === hotspotIdToUpdate);

                if (hotspotIndex === -1) {
                    const errorMsg = `Cannot update hotspot: Hotspot with ID '${hotspotIdToUpdate}' not found in map '${targetMapId}'`;
                    console.error(errorMsg);
                    setError(errorMsg);
                    return prevMapData;
                }

                mapDef.hotspots[hotspotIndex] = {
                    ...mapDef.hotspots[hotspotIndex],
                    ...newDetails, // Apply all new details
                    // Ensure linkType consistency if it's part of newDetails
                };
                return newMapData;
            });
        },
        [setManagedMapData, setError]
    );

    // Action: Add this entire function definition block
    /**
     * Updates the image URL for a specific map ID.
     * @param mapId The ID of the map whose image URL should be updated.
     * @param newImageUrl The new URL string for the image.
     */
    const updateMapImageUrl = useCallback((mapId: string, newImageUrl: string) => {
        setError(null);
        setManagedMapData(prevMapData => {
            const newMapData = JSON.parse(JSON.stringify(prevMapData));
            const mapDef = newMapData[mapId];

            if (!mapDef) {
                const errorMsg = `Cannot update image URL: Map definition not found for ID '${mapId}'`;
                console.error(errorMsg);
                setError(errorMsg);
                return prevMapData; // Return original data on error
            }

            // Validate new URL (basic)
            const trimmedUrl = newImageUrl.trim();
            if (!trimmedUrl) {
                const errorMsg = "New image URL cannot be empty when updating.";
                console.error(errorMsg);
                setError(errorMsg);
                return prevMapData; // Prevent setting empty URL
            }
            try { new URL(trimmedUrl); } catch (_) {
                if (!trimmedUrl.startsWith('/')) {
                    const errorMsg = 'Invalid image URL format when updating.';
                    console.error(errorMsg, trimmedUrl);
                    setError(errorMsg);
                    return prevMapData;
                }
            }

            // Update the imageUrl
            mapDef.imageUrl = trimmedUrl;
            console.log(`Updated image URL for map '${mapId}' to '${trimmedUrl}'`);

            // If the updated map is the currently viewed map,
            // the useEffect hook watching [managedMapData, currentMapId]
            // should automatically update currentMapDisplayData.

            return newMapData; // Return the updated map data structure
        });
    }, [setManagedMapData, setError]); // Dependencies: state setters

    /**
     * Updates the stored transform (zoom/pan) state for a given map ID.
     * Only updates if the new transform values are different from the existing ones.
     * @param mapId The ID of the map whose transform state is being updated.
     * @param newTransform The new transform state (scale, x, y).
     */
    const updateMapViewTransform = useCallback((mapId: string, newTransform: MapViewTransform) => {
        if (mapId) { // Ensure mapId is valid before updating
            setMapViewTransforms(prevTransforms => {
                const existingTransform = prevTransforms[mapId];
                if (existingTransform && existingTransform.scale === newTransform.scale && existingTransform.x === newTransform.x && existingTransform.y === newTransform.y) {
                    return prevTransforms; // No change needed, return same object to prevent re-render
                }
                return { ...prevTransforms, [mapId]: newTransform };
            });
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
        updateMapImageUrl,
        updateHotspotDetails,
        mapViewTransforms,
        updateMapViewTransform,
    };
};