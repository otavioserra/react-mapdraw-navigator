// src/MapdrawInstanceWrapper.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Mapdraw, { MapdrawConfig } from './Mapdraw';
import { MapInstanceContextProvider, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from './contexts/MapInstanceContext';

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
                const rect = observedElement.getBoundingClientRect();
                const style = window.getComputedStyle(observedElement);

                const newWidth = rect.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth) - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
                const newHeight = rect.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

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
    const baseDims = config?.baseDims ?? { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };

    const contextValue = {
        containerDims: currentContainerDims,
        controlsHeight: currentControlsHeight,
        baseDims: baseDims
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