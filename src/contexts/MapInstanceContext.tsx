// src/contexts/MapInstanceContext.tsx
import { createContext, useContext } from 'react';

// Shape of the context data: container dimensions
interface MapInstanceContextType {
    containerDims: { width: number; height: number } | null;
    controlsHeight: number | null;
}

// Create context with a default value
const MapInstanceContext = createContext<MapInstanceContextType>({
    containerDims: null,
    controlsHeight: null,
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