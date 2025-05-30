// src/MapdrawInstanceWrapper.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);
    const [isWindowMaximized, setIsWindowMaximized] = useState<boolean>(false);
    const originalContainerClassesRef = useRef<string>('');

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

    // Add another useEffect for native fullscreen changes
    useEffect(() => {
        const handleActualFullscreenChange = () => {
            setIsFullscreenActive(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleActualFullscreenChange);
        // Also for webkit browsers
        document.addEventListener('webkitfullscreenchange', handleActualFullscreenChange);
        // Also for ms browsers
        document.addEventListener('msfullscreenchange', handleActualFullscreenChange);


        return () => {
            document.removeEventListener('fullscreenchange', handleActualFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleActualFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleActualFullscreenChange);
        };
    }, []);

    // Add useEffect to manage full window classes on containerElement
    useEffect(() => {
        if (!containerElement) return;

        if (isWindowMaximized) {
            // Store original classes if not already stored
            if (!originalContainerClassesRef.current) {
                originalContainerClassesRef.current = containerElement.className;
            }
            // Apply fullscreen window classes
            containerElement.className = 'fixed inset-0 w-screen h-screen bg-white z-40 overflow-auto p-0 m-0 border-0 rounded-none react-mapdraw-navigator';
        } else {
            // Restore original classes if they were stored
            if (originalContainerClassesRef.current) {
                containerElement.className = originalContainerClassesRef.current;
            }
        }
    }, [isWindowMaximized, containerElement]);

    const handleControlsHeightChange = useCallback((height: number) => {
        setCurrentControlsHeight(prevHeight => {
            if (height !== prevHeight) {
                return height;
            }
            return prevHeight;
        });
    }, []);

    // Add handler to toggle window maximized mode
    const handleToggleWindowMaximize = useCallback(() => {
        setIsWindowMaximized(prev => !prev);
    }, []);

    // Add handler to toggle fullscreen
    const handleToggleFullscreen = useCallback(() => {
        if (!containerElement) return; // Guard clause

        if (!document.fullscreenElement) {
            containerElement.requestFullscreen()
                .then(() => {
                    // State update might be handled by the event listener,
                    // but setting it here can be a good immediate feedback
                    // setIsFullscreenActive(true); 
                })
                .catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                    .then(() => {
                        // setIsFullscreenActive(false);
                    })
                    .catch(err => {
                        console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
                    });
            }
        }
    }, [containerElement]);

    // Prepare context value
    const baseDims = config?.baseDims ?? { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };

    const contextValue = {
        containerDims: currentContainerDims,
        controlsHeight: currentControlsHeight,
        baseDims: baseDims,
        rootContainerElement: containerElement,
    };

    // Render the actual Mapdraw wrapped in the provider
    return (
        <MapInstanceContextProvider value={contextValue}>
            <Mapdraw
                rootMapId={rootMapId}
                initialDataJsonString={initialDataJsonString}
                config={config}
                onHeightChange={handleControlsHeightChange}
                isFullscreenActive={isFullscreenActive}
                onToggleFullscreen={handleToggleFullscreen}
                isWindowMaximized={isWindowMaximized}
                onToggleWindowMaximize={handleToggleWindowMaximize}
            />
        </MapInstanceContextProvider>
    );
};

export default MapdrawInstanceWrapper;