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

    // Flag to check if running inside an iframe
    const isInIframe = window.self !== window.top;

    // Effect to set up observer for container dimensions
    useEffect(() => {
        const observedElement = containerElement;
        if (!observedElement) return;

        // Store original classes only once on initial mount
        if (!originalContainerClassesRef.current) {
            originalContainerClassesRef.current = observedElement.className;
        }

        const updateDimensions = () => {
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
        updateDimensions(); // Initial call

        return () => {
            resizeObserver.unobserve(observedElement);
        };
    }, [containerElement]);

    // Effect for native fullscreen changes
    useEffect(() => {
        const handleActualFullscreenChange = () => {
            setIsFullscreenActive(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleActualFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleActualFullscreenChange);
        document.addEventListener('msfullscreenchange', handleActualFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleActualFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleActualFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleActualFullscreenChange);
        };
    }, []);

    // Effect to listen for messages from parent (if in iframe) for window maximization status
    useEffect(() => {
        if (!isInIframe) return;

        const handleMessage = (event: MessageEvent) => {
            // IMPORTANT: For production, you should verify event.origin
            // Example: if (event.origin !== "https://your-parent-domain.com") return;

            if (event.data && typeof event.data === 'object' && event.data.type === 'MAPDRAW_MAXIMIZE_STATUS_UPDATE') {
                setIsWindowMaximized(event.data.isMaximized);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [isInIframe]);


    // Effect to apply/remove "full window" classes when NOT in an iframe
    useEffect(() => {
        if (isInIframe) return;

        if (isWindowMaximized) {
            // Store original classes if not already stored (might be redundant but safe)
            if (!originalContainerClassesRef.current) {
                originalContainerClassesRef.current = containerElement.className;
            }
            containerElement.className = 'fixed inset-0 w-screen h-screen bg-white z-40 overflow-auto p-0 m-0 border-0 rounded-none react-mapdraw-navigator';
        } else {
            // Restore original classes only if they were stored
            if (originalContainerClassesRef.current) {
                containerElement.className = originalContainerClassesRef.current;
            }
        }
    }, [isWindowMaximized, containerElement, isInIframe]);


    const handleControlsHeightChange = useCallback((height: number) => {
        setCurrentControlsHeight(prevHeight => {
            if (height !== prevHeight) {
                return height;
            }
            return prevHeight;
        });
    }, []);

    // Handler to toggle window maximized mode
    const handleToggleWindowMaximize = useCallback(() => {
        if (isInIframe) {
            // If inside an iframe, send a message to the parent to request maximization toggle
            window.parent.postMessage({
                type: 'REQUEST_MAPDRAW_MAXIMIZE_TOGGLE',
                maximize: !isWindowMaximized // Tell parent the desired new state
            }, '*'); // IMPORTANT: Replace '*' with the parent's origin in production
        } else {
            // If not in iframe, toggle locally
            setIsWindowMaximized(prev => !prev);
        }
    }, [isInIframe, isWindowMaximized]);

    // Handler to toggle native fullscreen
    const handleToggleFullscreen = useCallback(() => {
        if (!containerElement) return;

        if (!document.fullscreenElement) {
            containerElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
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
