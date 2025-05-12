// src/contexts/MapInstanceContext.tsx
import { createContext, useContext } from 'react';

// Define a default fixed canvas size (e.g., 4K resolution)
export const DEFAULT_CANVAS_WIDTH = 3840;
export const DEFAULT_CANVAS_HEIGHT = 2160;

// Shape of the context data: container dimensions
interface MapInstanceContextType {
    containerDims: { width: number; height: number } | null;
    controlsHeight: number | null;
    baseDims: { width: number; height: number };
    rootContainerElement: HTMLDivElement | null;
}

// Create context with default values
const MapInstanceContext = createContext<MapInstanceContextType>({
    containerDims: null,
    controlsHeight: null,
    baseDims: { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT },
    rootContainerElement: null,
});

// Custom hook for easy consumption
export const useMapInstanceContext = () => {
    const context = useContext(MapInstanceContext);
    if (context === undefined) {
        throw new Error('useMapInstanceContext must be used within a MapInstanceContextProvider');
    }
    return context;
};

// Export the Provider component directly
export const MapInstanceContextProvider = MapInstanceContext.Provider;