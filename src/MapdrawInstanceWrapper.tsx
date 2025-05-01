// src/MapdrawInstanceWrapper.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Mapdraw, { MapdrawConfig } from './Mapdraw';
import { MapInstanceContextProvider } from './contexts/MapInstanceContext';

interface MapdrawInstanceWrapperProps {
    // Receives the actual DOM element where Mapdraw should be rendered
    // and whose dimensions should be tracked
    containerElement: HTMLDivElement;
    rootMapId: string;
    initialDataJsonString?: string;
    config: MapdrawConfig;
}

const MapdrawInstanceWrapper: React.FC<MapdrawInstanceWrapperProps> = ({
    containerElement,
    rootMapId,
    initialDataJsonString,
    config
}) => {
    // States
    const [currentContainerDims, setCurrentContainerDims] = useState<{ width: number; height: number } | null>(null);
    const [currentControlsHeight, setCurrentControlsHeight] = useState<number | null>(null);

    // Effect to set up observer
    useEffect(() => {
        const observedElement = containerElement;
        if (!observedElement) return;

        // --- Setup ResizeObserver ---
        const updateDimensions = () => {
            // Use functional update for safety with observer callback timing
            setCurrentContainerDims(prevDims => {
                const newWidth = observedElement.offsetWidth;
                const newHeight = observedElement.offsetHeight;
                if (prevDims?.width !== newWidth || prevDims?.height !== newHeight) {
                    return { width: newWidth, height: newHeight };
                }
                return prevDims; // No change
            });
        };

        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(observedElement);
        updateDimensions(); // Initial call to set dimensions

        // Cleanup
        return () => {
            resizeObserver.unobserve(observedElement);
        };

    }, [containerElement]);

    const handleControlsHeightChange = useCallback((height: number) => {
        setCurrentControlsHeight(prevHeight => {
            if (height !== prevHeight) {
                return height;
            }
            return prevHeight;
        });
    }, []);

    // Prepare context value
    const contextValue = {
        containerDims: currentContainerDims,
        controlsHeight: currentControlsHeight
    };

    // Render the actual Mapdraw wrapped in the provider
    return (
        <MapInstanceContextProvider value={contextValue}>
            <Mapdraw
                rootMapId={rootMapId}
                initialDataJsonString={initialDataJsonString}
                config={config}
                onHeightChange={handleControlsHeightChange}
            />
        </MapInstanceContextProvider>
    );
};

export default MapdrawInstanceWrapper;