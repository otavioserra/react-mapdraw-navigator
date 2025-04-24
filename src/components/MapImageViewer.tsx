// src/components/MapImageViewer.tsx
import React, { useState, useRef, MouseEvent } from 'react';
// Assuming Hotspot type is defined in useMapNavigation and exported
import { Hotspot, MapDisplayData, EditAction } from '../hooks/useMapNavigation';

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
}

const MapImageViewer: React.FC<MapImageViewerProps> = ({
    imageUrl,
    hotspots,
    onHotspotClick,
    isEditMode,
    onHotspotDrawn,
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

    // --- Styles ---
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        lineHeight: '0',
        cursor: isEditMode ? 'crosshair' : 'default',
        userSelect: 'none',
    };

    const imageStyle: React.CSSProperties = {
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        pointerEvents: isEditMode ? 'none' : 'auto', // Prevent image interaction during drawing
    };

    // --- Updated Hotspot Styling ---
    const getHotspotStyle = (hotspot: Hotspot): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
            boxSizing: 'border-box',
            transition: 'background-color 0.2s ease, border 0.2s ease',
            zIndex: 1, // Ensure hotspots are below the drawing rectangle
        };

        if (isEditMode) {
            // Style for Edit Mode (visible but distinct)
            return {
                ...baseStyle,
                cursor: 'default', // No pointer cursor
                backgroundColor: 'rgba(255, 165, 0, 0.2)', // Orange tint
                border: '1px dashed orange',
                pointerEvents: 'none', // Let clicks pass through to container for drawing
            };
        } else {
            // Style for View Mode (clickable)
            return {
                ...baseStyle,
                cursor: 'pointer',
                backgroundColor: 'rgba(0, 255, 0, 0.1)', // Green tint
                border: '1px dashed rgba(0, 0, 0, 0.4)',
                pointerEvents: 'auto', // Allow clicks
            };
        }
    };

    const drawingRectStyle: React.CSSProperties = {
        position: 'absolute',
        border: '2px dashed red', // Make it more visible
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 5, // Ensure drawing rectangle is above existing hotspots
    };

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves container
        >
            <img ref={imgRef} src={imageUrl} alt="Map Diagram" style={imageStyle} />

            {/* Render existing hotspots - ALWAYS RENDERED NOW */}
            {hotspots.map((hotspot) => (
                <div
                    key={hotspot.id}
                    style={getHotspotStyle(hotspot)}
                    onClick={(e) => {
                        // Only trigger navigation click if NOT in edit mode
                        if (!isEditMode) {
                            e.stopPropagation(); // Prevent event bubbling
                            onHotspotClick(hotspot.link_to_map_id);
                        }
                        // In edit mode, the click does nothing on the hotspot itself
                        // because pointerEvents is 'none'
                    }}
                    title={isEditMode ? `Hotspot ID: ${hotspot.id}` : `Go to map: ${hotspot.link_to_map_id}`}
                >
                    {/* Optional: Render hotspot ID, maybe only in edit mode */}
                    {/* {isEditMode && <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.7)', padding: '1px 2px', position:'absolute', top:0, left:0 }}>{hotspot.id}</span>} */}
                </div>
            ))}

            {/* Render the rectangle being drawn */}
            {isDrawing && currentRect && (
                <div
                    style={{
                        ...drawingRectStyle,
                        left: `${currentRect.x}px`,
                        top: `${currentRect.y}px`,
                        width: `${currentRect.width}px`,
                        height: `${currentRect.height}px`,
                    }}
                />
            )}
        </div>
    );
};

export default MapImageViewer;
