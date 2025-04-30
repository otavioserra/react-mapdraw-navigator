// src/components/MapImageViewer.tsx
import React, { useState, useRef, MouseEvent, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import classNames from 'classnames';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import MapHotspotDisplay from './MapHotspotDisplay';
import Container from './Container';
import LoadingIndicator from './LoadingIndicator';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

// Handle type definition
export interface MapImageViewerRefHandle {
    doZoomIn: (step?: number, animationTime?: number) => void;
    doZoomOut: (step?: number, animationTime?: number) => void;
    doResetTransform: (animationTime?: number) => void;
}

// Define types for coordinates and rectangles used internally
interface Coords {
    x: number;
    y: number;
}

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Define the props for the component
interface MapImageViewerProps {
    imageUrl: string;
    hotspots: Hotspot[];
    onHotspotClick: (mapId: string) => void;
    isEditMode: boolean;
    onHotspotDrawn: (rect: Rect) => void;
    editAction: EditAction;
    currentMapId: string | null;
    hotspotToDeleteId: string | null;
    onSelectHotspotForDeletion: (hotspotId: string) => void;
    onClearSelection: () => void;
    onConfirmDeletion: (hotspotId: string) => void;
}

const MapImageViewer = forwardRef<MapImageViewerRefHandle, MapImageViewerProps>(({
    imageUrl,
    hotspots,
    onHotspotClick,
    isEditMode,
    onHotspotDrawn,
    editAction,
    currentMapId,
    hotspotToDeleteId,
    onSelectHotspotForDeletion,
    onClearSelection,
    onConfirmDeletion,
}, ref) => {
    // State for drawing logic
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startCoords, setStartCoords] = useState<Coords | null>(null);
    const [currentScale, setCurrentScale] = useState(1);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);
    const [imageOriginalDims, setImageOriginalDims] = useState<{ width: number; height: number } | null>(null);
    const [currentPosX, setCurrentPosX] = useState(0);
    const [currentPosY, setCurrentPosY] = useState(0);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);

    // Helper Function to get Mouse Coordinates Relative to Container
    const getRelativeCoords = (event: MouseEvent<HTMLDivElement>): Coords | null => {

        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        return { x, y };
    };

    // Mouse Event Handlers for Drawing
    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (!isEditMode || editAction !== 'adding') return;

        event.preventDefault();

        const coords = getRelativeCoords(event);
        if (!coords) return;

        setIsDrawing(true);
        setStartCoords(coords);
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startCoords) return;

        const currentRelativeCoords = getRelativeCoords(event);

        if (!currentRelativeCoords || !containerRef.current) return;

        const startRelativeX = startCoords.x;
        const startRelativeY = startCoords.y;
        const currentRelativeX = currentRelativeCoords.x;
        const currentRelativeY = currentRelativeCoords.y;

        const x = Math.min(startRelativeX, currentRelativeX);
        const y = Math.min(startRelativeY, currentRelativeY);
        const width = Math.abs(startRelativeX - currentRelativeX);
        const height = Math.abs(startRelativeY - currentRelativeY);

        setCurrentRect({ x, y, width, height });
    };

    const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startCoords || !currentRect) {
            setIsDrawing(false);
            setStartCoords(null);
            setCurrentRect(null);
            return;
        }

        setIsDrawing(false);

        if (containerRef.current && currentRect.width > 1 && currentRect.height > 1) {

            // Use transform state variables updated by onTransformed callback
            const scale = currentScale;
            const positionX = currentPosX;
            const positionY = currentPosY;

            // Use image dimensions from state updated by onLoad (Recommended) OR fallback to ref access (ensure imageOriginalDims state exists if using)
            let imageNaturalWidth = imageOriginalDims?.width ?? imgRef.current?.naturalWidth;
            let imageNaturalHeight = imageOriginalDims?.height ?? imgRef.current?.naturalHeight;

            if (!imageNaturalWidth || !imageNaturalHeight || imageNaturalWidth === 0 || imageNaturalHeight === 0) {
                console.error("Cannot calculate hotspot: Image dimensions not loaded or invalid.");
                setStartCoords(null);
                setCurrentRect(null);
                return;
            }

            // Offset apply correction
            imageNaturalWidth = imageNaturalWidth * (containerRef.current.offsetWidth / imageNaturalWidth);
            imageNaturalHeight = imageNaturalHeight * (containerRef.current.offsetHeight / imageNaturalHeight);

            // Convert container-relative pixel coordinates (currentRect)
            const imageX = (currentRect.x - positionX) / scale;
            const imageY = (currentRect.y - positionY) / scale;
            const imageWidth = currentRect.width / scale;
            const imageHeight = currentRect.height / scale;

            // Calculate percentage relative to the image's natural dimensions
            let relativeRect: Rect = {
                x: (imageX / imageNaturalWidth) * 100,
                y: (imageY / imageNaturalHeight) * 100,
                width: (imageWidth / imageNaturalWidth) * 100,
                height: (imageHeight / imageNaturalHeight) * 100,
            };

            // Clamp percentage values
            relativeRect.x = Math.max(0, Math.min(relativeRect.x, 100));
            relativeRect.y = Math.max(0, Math.min(relativeRect.y, 100));
            relativeRect.width = Math.max(0.1, Math.min(relativeRect.width, 100 - relativeRect.x));
            relativeRect.height = Math.max(0.1, Math.min(relativeRect.height, 100 - relativeRect.y));

            onHotspotDrawn(relativeRect);
        }

        setStartCoords(null);
        setCurrentRect(null);
    };

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
            setImageOriginalDims({ width: naturalWidth, height: naturalHeight });
        } else {
            setImageOriginalDims(null);
        }
    };

    const handleHotspotInteraction = (hotspotId: string, linkToMapId: string) => {
        if (isEditMode && editAction === 'selecting_for_deletion') {
            onSelectHotspotForDeletion(hotspotId);
        } else if (!isEditMode) {
            onHotspotClick(linkToMapId);
        }
    };

    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        if (editAction === 'selecting_for_deletion' && e.target === containerRef.current) {
            onClearSelection();
        }
    };

    const handleTransformed = useCallback((ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number }) => {
        setCurrentScale(state.scale);
        setCurrentPosX(state.positionX);
        setCurrentPosY(state.positionY);
    }, []);

    useEffect(() => {
        setImageOriginalDims(null);
        setIsImageLoading(true);

        const timerId = setTimeout(() => {
            const wrapperRefCurrent = transformWrapperRef.current;
            if (wrapperRefCurrent?.setTransform) {
                wrapperRefCurrent.setTransform(0, 0, 1, 0); // x=0, y=0, scale=1, animationTime=0
            }
            setIsImageLoading(false);
        }, 250);

        return () => clearTimeout(timerId);

    }, [currentMapId]);

    useImperativeHandle(ref, () => ({
        doZoomIn(step = 0.5, animationTime = 150) {
            transformWrapperRef.current?.zoomIn(step, animationTime);
        },
        doZoomOut(step = 0.5, animationTime = 150) {
            transformWrapperRef.current?.zoomOut(step, animationTime);
        },
        doResetTransform(animationTime = 150) {
            transformWrapperRef.current?.resetTransform(animationTime);
        }
    }), []);

    // Dynamic Classes Calculation
    const containerClasses = classNames(
        "relative block w-full h-full overflow-hidden",
        {
            'cursor-crosshair': isEditMode && editAction === 'adding',
            'cursor-default': !isEditMode || (isEditMode && editAction !== 'adding'),
        }
    );

    const imageClasses = classNames(
        "relative block w-full h-full object-contain",
        {
            'pointer-events-none': isEditMode && editAction === 'adding'
        }
    );

    const drawingRectClasses = "absolute border-2 border-dashed border-orange-500 bg-orange-500/20 box-border pointer-events-none z-[5]";

    return (
        <Container
            ref={containerRef}
            className={containerClasses}
            onClick={handleContainerClick}
        >
            {isImageLoading && <LoadingIndicator />}

            <TransformWrapper
                ref={transformWrapperRef}
                initialScale={1}
                initialPositionX={0}
                initialPositionY={0}
                minScale={0.3}
                maxScale={9}
                limitToBounds={false}
                doubleClick={{ disabled: true }}
                onTransformed={handleTransformed}
                disabled={isEditMode && (editAction === 'adding' || editAction === 'selecting_for_deletion')}
            >
                {() => (
                    <React.Fragment>
                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%", position: 'relative' }}
                            contentStyle={{ width: "100%", height: "100%" }}
                        >
                            <img
                                ref={imgRef}
                                src={imageUrl}
                                alt="Map Diagram"
                                className={imageClasses}
                                onLoad={handleImageLoad}
                            />

                            {hotspots.map((hotspot) => (
                                <MapHotspotDisplay
                                    key={hotspot.id}
                                    hotspot={hotspot}
                                    isEditMode={isEditMode}
                                    editAction={editAction}
                                    isSelected={hotspot.id === hotspotToDeleteId}
                                    onClick={handleHotspotInteraction}
                                    onDeleteClick={onConfirmDeletion}
                                />
                            ))}

                            {isEditMode && editAction === 'adding' && (
                                <div
                                    className="absolute inset-0 z-[4] cursor-crosshair"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                />
                            )}
                        </TransformComponent>
                    </React.Fragment>
                )}
            </TransformWrapper>

            {
                isDrawing && currentRect && editAction === 'adding' && (
                    <div
                        className={drawingRectClasses}
                        style={{
                            left: `${currentRect.x}px`,
                            top: `${currentRect.y}px`,
                            width: `${currentRect.width}px`,
                            height: `${currentRect.height}px`,
                        }}
                    />
                )
            }
        </Container>
    );
});

export default MapImageViewer;