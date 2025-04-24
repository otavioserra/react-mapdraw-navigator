// src/components/MapImageViewer.tsx
import React, { useState, useRef, MouseEvent } from 'react';
import classNames from 'classnames';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import MapHotspotDisplay from './MapHotspotDisplay';
import Container from './Container';

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
    hotspots: Hotspot[]; // Existing hotspots for the current map
    onHotspotClick: (mapId: string) => void; // For navigation in view mode
    isEditMode: boolean; // To toggle between view and edit modes
    onHotspotDrawn: (rect: Rect) => void; // Callback when a new rect is drawn
    editAction: EditAction;
    currentMapId: string | null; // Needed if delete action happens here
    hotspotToDeleteId: string | null; // ID of hotspot selected for deletion
    onSelectHotspotForDeletion: (hotspotId: string) => void; // Callback when hotspot selected
    onClearSelection: () => void; // Callback to clear selection
    onConfirmDeletion: (hotspotId: string) => void; // Callback to confirm delete
}

const MapImageViewer: React.FC<MapImageViewerProps> = ({
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
}) => {
    // State for drawing logic
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [startCoords, setStartCoords] = useState<Coords | null>(null);
    const [currentRect, setCurrentRect] = useState<Rect | null>(null);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // --- Helper Function to get Mouse Coordinates Relative to Container ---
    const getRelativeCoords = (event: MouseEvent<HTMLDivElement>): Coords | null => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
    };

    // --- Mouse Event Handlers for Drawing ---
    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (!isEditMode || event.target !== containerRef.current) return; // Only draw in edit mode AND directly on the container

        event.preventDefault();
        const coords = getRelativeCoords(event);
        if (!coords) return;

        setIsDrawing(true);
        setStartCoords(coords);
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    };

    const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startCoords) return;

        const currentCoords = getRelativeCoords(event);
        if (!currentCoords || !containerRef.current) return;

        const x = Math.min(startCoords.x, currentCoords.x);
        const y = Math.min(startCoords.y, currentCoords.y);
        const width = Math.abs(startCoords.x - currentCoords.x);
        const height = Math.abs(startCoords.y - currentCoords.y);

        setCurrentRect({ x, y, width, height });
    };

    const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
        if (!isDrawing || !startCoords || !currentRect) return;

        setIsDrawing(false);

        // Calculate Final Rectangle Relative to Image Container (as percentages)
        if (containerRef.current && currentRect.width > 1 && currentRect.height > 1) { // Require min size
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;

            const relativeRect: Rect = {
                x: (currentRect.x / containerWidth) * 100,
                y: (currentRect.y / containerHeight) * 100,
                width: (currentRect.width / containerWidth) * 100,
                height: (currentRect.height / containerHeight) * 100,
            };

            // Clamp percentage values
            relativeRect.x = Math.max(0, Math.min(relativeRect.x, 100));
            relativeRect.y = Math.max(0, Math.min(relativeRect.y, 100));
            relativeRect.width = Math.max(0.1, Math.min(relativeRect.width, 100 - relativeRect.x));
            relativeRect.height = Math.max(0.1, Math.min(relativeRect.height, 100 - relativeRect.y));

            onHotspotDrawn(relativeRect); // Trigger callback with relative coords
        }

        // Reset drawing state
        setStartCoords(null);
        setCurrentRect(null);
    };

    // --- Add Dynamic Classes Calculation ---
    const containerClasses = classNames(
        "relative inline-block max-w-full leading-none select-none", // Base styles from old containerStyle
        { // Dynamic cursor based on edit mode and action
            'cursor-crosshair': isEditMode && editAction === 'adding',
            'cursor-default': !isEditMode || (isEditMode && editAction !== 'adding'),
        }
    );

    const imageClasses = classNames(
        "block max-w-full h-auto", // Base styles from old imageStyle
        { // Disable pointer events ONLY when drawing
            'pointer-events-none': isEditMode && editAction === 'adding'
        }
    );

    // --- Add Unified Hotspot Interaction Handler ---
    // This simplifies props passed to MapHotspotDisplay
    const handleHotspotInteraction = (hotspotId: string, linkToMapId: string) => {
        if (isEditMode && editAction === 'selecting_for_deletion') {
            onSelectHotspotForDeletion(hotspotId); // Select/deselect logic
        } else if (!isEditMode) {
            onHotspotClick(linkToMapId); // Navigate in view mode
        }
        // Clicks are ignored in other edit modes ('adding', 'none')
    };

    // --- Add Container Background Click Handler ---
    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        // Clear selection if clicking directly on the container background
        // while in selection mode
        if (editAction === 'selecting_for_deletion' && e.target === containerRef.current) {
            onClearSelection();
        }
        // Do NOT handle drawing start here (use onMouseDown)
    };

    // --- Drawing Rectangle Classes --- (Define classes separately)
    const drawingRectClasses = "absolute border-2 border-dashed border-red-500 bg-red-500/10 box-border pointer-events-none z-[5]";

    // Now the return statement follows...

    // Replace the entire return statement (around line 213 onwards)
    return (
        <Container // Changed from div
            ref={containerRef}
            className={containerClasses} // Pass the calculated classes
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves
            onClick={handleContainerClick} // Handle background clicks
        // We use variant="default" implicitly or could add a specific one if needed
        >
            <img
                ref={imgRef}
                src={imageUrl}
                alt="Map Diagram"
                className={imageClasses} // Use classes instead of style
            />

            {/* Render hotspots using the new subcomponent */}
            {hotspots.map((hotspot) => (
                <MapHotspotDisplay
                    key={hotspot.id}
                    hotspot={hotspot}
                    isEditMode={isEditMode}
                    editAction={editAction}
                    isSelected={hotspot.id === hotspotToDeleteId} // Pass selection status
                    onClick={handleHotspotInteraction} // Pass unified handler
                    onDeleteClick={onConfirmDeletion} // Pass deletion handler
                />
            ))}

            {/* Render the rectangle being drawn */}
            {/* Keeping this as a div for simplicity, as it's temporary and absolutely positioned */}
            {isDrawing && currentRect && (
                <div
                    className={drawingRectClasses} // Use Tailwind classes
                    style={{ // Inline styles ONLY for dynamic position/size in pixels
                        left: `${currentRect.x}px`,
                        top: `${currentRect.y}px`,
                        width: `${currentRect.width}px`,
                        height: `${currentRect.height}px`,
                    }}
                />
            )}
            {/* --- CHANGE THIS: Closing Container tag --- */}
        </Container> // Changed from div
    );
};

export default MapImageViewer;
