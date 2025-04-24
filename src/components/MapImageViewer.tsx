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
            transition: 'background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease', // Added box-shadow transition
            zIndex: 1,
        };

        // Determine if this hotspot is selected for deletion
        const isSelectedForDeletion = isEditMode && editAction === 'selecting_for_deletion' && hotspot.id === hotspotToDeleteId;

        if (isEditMode) {
            if (editAction === 'selecting_for_deletion') {
                // Specific styles for selection mode
                return {
                    ...baseStyle,
                    cursor: 'pointer', // Make it clickable for selection
                    backgroundColor: isSelectedForDeletion
                        ? 'rgba(255, 0, 0, 0.4)' // Stronger red background if selected
                        : 'rgba(255, 0, 0, 0.1)', // Light red tint if selectable
                    border: isSelectedForDeletion
                        ? '2px solid red' // Solid red border if selected
                        : '1px dashed rgba(255, 0, 0, 0.7)', // Dashed red border if selectable
                    pointerEvents: 'auto', // Make it clickable
                    boxShadow: isSelectedForDeletion ? '0 0 8px 2px rgba(255, 0, 0, 0.7)' : 'none', // Glow effect when selected
                };
            } else if (editAction === 'adding') {
                // Style while adding (visible but non-interactive)
                return {
                    ...baseStyle,
                    cursor: 'crosshair', // Match container cursor maybe? Or default.
                    backgroundColor: 'rgba(255, 165, 0, 0.1)', // Orange tint
                    border: '1px dashed orange',
                    pointerEvents: 'none', // Clicks pass through for drawing
                };
            } else { // isEditMode but action is 'none'
                return { // Similar to adding mode, maybe less prominent
                    ...baseStyle,
                    cursor: 'default',
                    backgroundColor: 'rgba(200, 200, 200, 0.1)',
                    border: '1px dashed #aaa',
                    pointerEvents: 'none',
                };
            }
        } else {
            // Style for View Mode (clickable for navigation)
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
            onClick={(e) => {
                // Only clear if clicking directly on the container (not a hotspot)
                // and in selection mode
                if (editAction === 'selecting_for_deletion' && e.target === containerRef.current) {
                    onClearSelection();
                }
            }}
        >
            <img ref={imgRef} src={imageUrl} alt="Map Diagram" style={imageStyle} />

            {hotspots.map((hotspot) => {
                // Determine if this hotspot is selected for deletion
                const isSelectedForDeletion = isEditMode && editAction === 'selecting_for_deletion' && hotspot.id === hotspotToDeleteId;

                return (
                    <div // This is the main hotspot div
                        key={hotspot.id}
                        style={getHotspotStyle(hotspot)}
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent container onClick from firing
                            if (isEditMode && editAction === 'selecting_for_deletion') {
                                // If in selection mode, call the selection handler
                                onSelectHotspotForDeletion(hotspot.id);
                            } else if (!isEditMode) {
                                // Only trigger navigation click if NOT in edit mode
                                onHotspotClick(hotspot.link_to_map_id);
                            }
                            // Clicks are ignored in 'adding' mode due to getHotspotStyle pointerEvents: 'none'
                        }}
                        title={
                            isEditMode
                                ? (editAction === 'selecting_for_deletion' ? `Select/Deselect Hotspot ID: ${hotspot.id}` : `Hotspot ID: ${hotspot.id}`)
                                : `Go to map: ${hotspot.link_to_map_id}`
                        }
                    >
                        {/* --- Render Delete Button Conditionally --- */}
                        {isSelectedForDeletion && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent hotspot onClick
                                    // Add a confirmation dialog before deleting maybe?
                                    // if (window.confirm(`Are you sure you want to delete hotspot ${hotspot.id}?`)) {
                                    onConfirmDeletion(hotspot.id);
                                    // }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '-8px', // Position slightly outside/overlapping top-right
                                    right: '-8px',
                                    background: 'red',
                                    color: 'white',
                                    border: '1px solid darkred',
                                    borderRadius: '50%', // Circular button
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '12px',
                                    lineHeight: '18px', // Adjust for vertical centering
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10, // Ensure button is clickable
                                    boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                                }}
                                title={`Delete hotspot ${hotspot.id}`}
                            >
                                X {/* Simple 'X' delete symbol */}
                            </button>
                        )}
                        {/* Optional: Render hotspot ID */}
                        {/* ... */}
                    </div>
                );
            })}

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
