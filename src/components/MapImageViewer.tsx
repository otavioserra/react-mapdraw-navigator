// src/components/MapImageViewer.tsx
import React, { useState, useRef, MouseEvent, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import classNames from 'classnames';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import MapHotspotDisplay from './MapHotspotDisplay';
import Container from './Container';
import LoadingIndicator from './LoadingIndicator';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { useMapInstanceContext, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../contexts/MapInstanceContext';

// Handle type definition
export interface MapImageViewerRefHandle {
    doZoomIn: (step?: number, animationTime?: number) => void;
    doZoomOut: (step?: number, animationTime?: number) => void;
    doResetTransform: (animationTime?: number) => void;
}

interface TransformData {
    scale: number;
    x: number;
    y: number;
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
    onHotspotClick: (hotspotId: string) => void;
    isEditMode: boolean;
    onHotspotDrawn: (rect: Rect) => void;
    editAction: EditAction;
    currentMapId: string | null;
    hotspotToDeleteId: string | null;
    onSelectHotspotForDeletion: (hotspotId: string) => void;
    onClearSelection: () => void;
    onConfirmDeletion: (hotspotId: string) => void;
    isFullscreenActive?: boolean;
    onSelectHotspotForEditing?: (hotspotId: string) => void;
    isWindowMaximized?: boolean;
    isModalOpen?: boolean;
    initialTransformForCurrentMap?: TransformData;
    onTransformChange?: (transform: TransformData) => void;
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
    isFullscreenActive,
    onSelectHotspotForEditing,
    isWindowMaximized,
    isModalOpen,
    initialTransformForCurrentMap,
    onTransformChange
}, ref) => {
    // States
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startCoords, setStartCoords] = useState<Coords | null>(null);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
    const [containerCanvaStyle, setContainerCanvaStyle] = useState<React.CSSProperties | undefined>(undefined);
    const [transformData, setTransformData] = useState<TransformData>({ scale: 1, x: 0, y: 0 });
    const [transformCurrentData, setTransformCurrentData] = useState<TransformData>({ scale: 1, x: 0, y: 0 });

    const { containerDims, controlsHeight, baseDims } = useMapInstanceContext();

    const canvasWidth = baseDims?.width ?? DEFAULT_CANVAS_WIDTH;
    const canvasHeight = baseDims?.height ?? DEFAULT_CANVAS_HEIGHT;

    const imgAnimationTime = 1;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const containerCanvaRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const transformWrapperRef = useRef<ReactZoomPanPinchRef>(null);
    const isReadyToSaveChangesRef = useRef<boolean>(false); // Controls when transform changes are saved

    // Helper Function to get Mouse Coordinates Relative to Container
    const getRelativeCoords = (event: MouseEvent<HTMLDivElement>): Coords | null => {
        if (!containerCanvaRef.current) return null;
        const rectCanva = containerCanvaRef.current.getBoundingClientRect();
        const x = (event.clientX - rectCanva.left);
        const y = (event.clientY - rectCanva.top);
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
        if (!currentRelativeCoords) return;
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

    const handleMouseUp = () => {
        if (!isDrawing || !startCoords || !currentRect) {
            setIsDrawing(false);
            setStartCoords(null);
            setCurrentRect(null);
            return;
        }
        setIsDrawing(false);
        if (containerCanvaRef.current && currentRect.width > 1 && currentRect.height > 1) {
            const scale = transformCurrentData.scale;
            const positionX = transformCurrentData.x;
            const positionY = transformCurrentData.y;
            const drawnRectOnImageX = (currentRect.x - positionX) / scale;
            const drawnRectOnImageY = (currentRect.y - positionY) / scale;
            const drawnRectOnImageWidth = currentRect.width / scale;
            const drawnRectOnImageHeight = (currentRect.height) / scale;

            if (canvasWidth === 0 || canvasHeight === 0) {
                console.error("Canvas dimensions are zero. Cannot calculate relative hotspot.");
                setStartCoords(null);
                setCurrentRect(null);
                return;
            }
            let relativeRect: Rect = {
                x: (drawnRectOnImageX / canvasWidth) * 100,
                y: (drawnRectOnImageY / canvasHeight) * 100,
                width: (drawnRectOnImageWidth / canvasWidth) * 100,
                height: (drawnRectOnImageHeight / canvasHeight) * 100,
            };
            relativeRect.x = Math.max(0, Math.min(relativeRect.x, 100));
            relativeRect.y = Math.max(0, Math.min(relativeRect.y, 100));
            relativeRect.width = Math.max(0.1, Math.min(relativeRect.width, 100 - relativeRect.x));
            relativeRect.height = Math.max(0.1, Math.min(relativeRect.height, 100 - relativeRect.y));
            onHotspotDrawn(relativeRect);
        }
        setStartCoords(null);
        setCurrentRect(null);
    };

    const getCanvasCoordsFromTouchEvent = (event: React.TouchEvent<HTMLDivElement>): Coords | null => {
        if (!containerCanvaRef.current || event.touches.length === 0) return null;
        const touch = event.touches[0];
        const rectCanva = containerCanvaRef.current.getBoundingClientRect();
        const x = touch.clientX - rectCanva.left;
        const y = touch.clientY - rectCanva.top;
        return { x, y };
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!isEditMode || editAction !== 'adding') return;
        event.preventDefault();
        const canvasCoords = getCanvasCoordsFromTouchEvent(event);
        if (!canvasCoords) return;
        setIsDrawing(true);
        setStartCoords(canvasCoords);
        setCurrentRect({ x: canvasCoords.x, y: canvasCoords.y, width: 0, height: 0 });
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!isDrawing || !startCoords) return;
        event.preventDefault();
        const currentCanvasCoords = getCanvasCoordsFromTouchEvent(event);
        if (!currentCanvasCoords) return;
        const startCanvasX = startCoords.x;
        const startCanvasY = startCoords.y;
        const currentCanvasX = currentCanvasCoords.x;
        const currentCanvasY = currentCanvasCoords.y;
        const x = Math.min(startCanvasX, currentCanvasX);
        const y = Math.min(startCanvasY, currentCanvasY);
        const width = Math.abs(startCanvasX - currentCanvasX);
        const height = Math.abs(startCanvasY - currentCanvasY);
        setCurrentRect({ x, y, width, height });
    };

    const finalizeDrawing = () => {
        if (!isDrawing || !startCoords || !currentRect) {
            setIsDrawing(false);
            setStartCoords(null);
            setCurrentRect(null);
            return;
        }
        setIsDrawing(false);
        if (containerCanvaRef.current && currentRect.width > 1 && currentRect.height > 1) {
            const scale = transformCurrentData.scale;
            const positionX = transformCurrentData.x;
            const positionY = transformCurrentData.y;
            const drawnRectOnCanvasX = currentRect.x;
            const drawnRectOnCanvasY = currentRect.y;
            const drawnRectOnCanvasWidth = currentRect.width;
            const drawnRectOnCanvasHeight = currentRect.height;
            const imageX = (drawnRectOnCanvasX - positionX) / scale;
            const imageY = (drawnRectOnCanvasY - positionY) / scale;
            const imageWidth = drawnRectOnCanvasWidth / scale;
            const imageHeight = drawnRectOnCanvasHeight / scale;

            if (canvasWidth === 0 || canvasHeight === 0) {
                console.error("Canvas dimensions from context are zero. Cannot calculate relative hotspot.");
                setStartCoords(null);
                setCurrentRect(null);
                return;
            }
            let relativeRect: Rect = {
                x: (imageX / canvasWidth) * 100,
                y: (imageY / canvasHeight) * 100,
                width: (imageWidth / canvasWidth) * 100,
                height: (imageHeight / canvasHeight) * 100,
            };
            relativeRect.x = Math.max(0, Math.min(relativeRect.x, 100));
            relativeRect.y = Math.max(0, Math.min(relativeRect.y, 100));
            relativeRect.width = Math.max(0.1, Math.min(relativeRect.width, 100 - relativeRect.x));
            relativeRect.height = Math.max(0.1, Math.min(relativeRect.height, 100 - relativeRect.y));
            onHotspotDrawn(relativeRect);
        }
        setStartCoords(null);
        setCurrentRect(null);
    };

    const handleTouchEnd = () => {
        finalizeDrawing();
    };

    const handleHotspotInteraction = (hotspotId: string) => {
        if (isEditMode && editAction === 'selecting_for_deletion') {
            onSelectHotspotForDeletion(hotspotId);
        } else if (isEditMode && editAction === 'selecting_for_edit') {
            onSelectHotspotForEditing?.(hotspotId);
        } else if (!isEditMode) {
            const hotspot = hotspots.find(h => h.id === hotspotId);
            if (hotspot) {
                onHotspotClick(hotspot.id);
            }
        }
    };

    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        if (editAction === 'selecting_for_deletion' && e.target === containerCanvaRef.current) {
            onClearSelection();
        }
    };

    const handleTransformed = useCallback((_ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number }) => {
        const newTransform = { scale: state.scale, x: state.positionX, y: state.positionY };
        setTransformCurrentData(newTransform);
        if (onTransformChange && isReadyToSaveChangesRef.current && !isImageLoading) {
            onTransformChange(newTransform);
        }
    }, [onTransformChange, isImageLoading]);

    const imageChangeParams = useCallback(() => {
        if (!containerCanvaRef.current || !containerRef.current || !transformWrapperRef.current) return;
        const rectCanva = containerCanvaRef.current.getBoundingClientRect();
        const container = containerRef.current.getBoundingClientRect();
        let scale = 1;
        let x = 0;
        let y = 0;
        if (container.width > canvasWidth && container.height > canvasHeight) {
            scale = 1;
            x = rectCanva.left < 0 ? (-1) * rectCanva.left / 2 : 0;
            y = rectCanva.top < 0 ? (-1) * rectCanva.top / 2 : 0;
        } else {
            const percWidth = container.width / canvasWidth;
            const percHeight = container.height / canvasHeight;
            scale = percWidth < percHeight ? percWidth : percHeight;
            x = ((canvasWidth - container.width) / 2) + (container.width - canvasWidth * scale) / 2;
            y = ((canvasHeight - container.height) / 2) + (container.height - canvasHeight * scale) / 2;
        }
        const wrapperRefCurrent = transformWrapperRef.current;
        if (wrapperRefCurrent?.setTransform) {
            wrapperRefCurrent.setTransform(x, y, scale, imgAnimationTime);
            const calculatedTransform = { scale, x, y };
            setTransformData(calculatedTransform);
            setTransformCurrentData(calculatedTransform);
        }
    }, [canvasWidth, canvasHeight]);

    useEffect(() => {
        setIsImageLoading(true);
        isReadyToSaveChangesRef.current = false;
    }, [imageUrl, currentMapId]);

    const handleImageLoad = useCallback(() => {
        const applyInitialState = () => {
            if (transformWrapperRef.current) {
                transformWrapperRef.current.resetTransform(0);
                if (initialTransformForCurrentMap) {
                    transformWrapperRef.current.setTransform(
                        initialTransformForCurrentMap.x,
                        initialTransformForCurrentMap.y,
                        initialTransformForCurrentMap.scale,
                        imgAnimationTime
                    );
                    setTransformData(initialTransformForCurrentMap);
                    setTransformCurrentData(initialTransformForCurrentMap);
                } else {
                    imageChangeParams();
                }
            }
            setIsImageLoading(false);
            isReadyToSaveChangesRef.current = true;
        };
        const timerId = setTimeout(applyInitialState, 0);
        return () => clearTimeout(timerId);
    }, [initialTransformForCurrentMap, imageChangeParams, setIsImageLoading]);

    const handleImageError = useCallback(() => {
        console.error(`MapImageViewer: Failed to load image: ${imageUrl}`);
        setIsImageLoading(false);
        isReadyToSaveChangesRef.current = true;
    }, [imageUrl, setIsImageLoading]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            imageChangeParams();
        }, 50);
        return () => clearTimeout(timerId);
    }, [isFullscreenActive, isWindowMaximized, imageChangeParams]);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        const canvaStyle: React.CSSProperties = {
            left: (container.width > canvasWidth ? `${(-1) * (canvasWidth - container.width) / 2}px` : `${(container.width - canvasWidth) / 2}px`),
            top: (container.height > canvasHeight ? `${(-1) * (canvasHeight - container.height) / 2}px` : `${(container.height - canvasHeight) / 2}px`),
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
        };
        setContainerCanvaStyle(canvaStyle);
    }, [containerDims, controlsHeight, canvasWidth, canvasHeight]);

    useImperativeHandle(ref, () => ({
        doZoomIn(step = 0.5, animationTime = 150) {
            transformWrapperRef.current?.zoomIn(step, animationTime);
        },
        doZoomOut(step = 0.5, animationTime = 150) {
            transformWrapperRef.current?.zoomOut(step, animationTime);
        },
        doResetTransform(animationTime = 150) {
            const { scale, x, y } = transformData ?? { scale: 1, x: 0, y: 0 };
            if (!transformWrapperRef.current) return;
            transformWrapperRef.current?.setTransform(x, y, scale, animationTime);
        }
    }), [transformData]);

    const containerClasses = classNames(
        "rmn-container-map block overflow-hidden bg-gray-200",
        {
            'cursor-crosshair': isEditMode && editAction === 'adding',
            'cursor-move': !isEditMode,
            'touch-none': isEditMode && editAction === 'adding'
        }
    );

    const containerCanvaClasses = classNames(
        "rmn-container-canva absolute",
    );

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        left: '0',
        top: (controlsHeight ?? 0) + 'px',
        width: containerDims?.width ? `${containerDims.width}px` : '100%',
        height: containerDims?.height ? `${(containerDims.height - (controlsHeight ?? 0))}px` : '100%',
    };

    const containerTransForm: React.CSSProperties = {
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
    };

    const imageClasses = classNames(
        "relative block w-full h-full object-contain",
        {
            'pointer-events-none': isEditMode && editAction === 'adding'
        }
    );

    const drawingRectClasses = "absolute border-2 border-dashed border-green-500 bg-green-500/20 box-border pointer-events-none z-[5]";

    return (
        <Container
            ref={containerRef}
            className={containerClasses}
            style={containerStyle}
            onClick={handleContainerClick}
        >
            <LoadingIndicator
                isVisible={isImageLoading}
                containerDims={containerDims}
                controlsHeight={controlsHeight}
            />
            <Container
                ref={containerCanvaRef}
                className={containerCanvaClasses}
                style={containerCanvaStyle}
            >
                <TransformWrapper
                    ref={transformWrapperRef}
                    initialScale={1}
                    initialPositionX={0}
                    initialPositionY={0}
                    minScale={0.08}
                    maxScale={3}
                    limitToBounds={false}
                    doubleClick={{ disabled: true }}
                    onTransformed={handleTransformed}
                    disabled={isModalOpen || isDrawing}
                >
                    {() => (
                        <React.Fragment>
                            <TransformComponent
                                wrapperStyle={containerTransForm}
                                contentStyle={containerTransForm}
                            >
                                <img
                                    ref={imgRef}
                                    src={imageUrl}
                                    alt="Map Diagram"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    className={imageClasses}
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
                                        scale={transformCurrentData.scale}
                                    />
                                ))}
                                {isEditMode && editAction === 'adding' && (
                                    <div
                                        className="absolute inset-0 z-[4] cursor-crosshair"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchCancel={handleTouchEnd}
                                    />
                                )}
                            </TransformComponent>
                        </React.Fragment>
                    )}
                </TransformWrapper>
                {isDrawing && currentRect && editAction === 'adding' && (
                    <div
                        className={drawingRectClasses}
                        style={{
                            left: `${currentRect.x}px`,
                            top: `${currentRect.y}px`,
                            width: `${currentRect.width}px`,
                            height: `${currentRect.height}px`,
                        }}
                    />
                )}
            </Container>
        </Container >
    );
});

export default MapImageViewer;
