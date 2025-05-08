// src/components/MapHotspotDisplay.tsx
import React from 'react';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import Button from './Button';
import Container from './Container';

interface MapHotspotDisplayProps {
    hotspot: Hotspot;
    isEditMode: boolean;
    editAction: EditAction;
    isSelected: boolean;
    onClick: (id: string, link: string) => void;
    onDeleteClick: (id: string) => void;
}

const MapHotspotDisplay: React.FC<MapHotspotDisplayProps> = ({
    hotspot,
    isEditMode,
    editAction,
    isSelected,
    onClick,
    onDeleteClick,
}) => {

    // --- Calculate Tailwind Classes based on state ---
    const baseClasses = "absolute box-border transition-colors transition-shadow duration-200 ease-in-out z-[1]"; // Base styles + z-index 1
    let modeClasses = "";

    if (isEditMode) {
        if (editAction === 'selecting_for_deletion') {
            modeClasses = `cursor-pointer border-2 border-dashed border-red-900/70 bg-red-500/70 hover:bg-red-500/20 pointer-events-auto animate-pulse`;
            if (isSelected) {
                modeClasses = `cursor-pointer border-2 border-solid border-red-900 bg-red-700/70 pointer-events-auto shadow-lg shadow-red-500/50 ring-2 ring-red-400 ring-offset-1 animate-pulse`; // Enhanced selected style
            }
        } else if (editAction === 'adding') {
            modeClasses = `cursor-default border-2 border-dashed border-green-700 bg-green-500/70 pointer-events-none animate-pulse`; // Visible but non-interactive
        } else { // isEditMode but action is 'none'
            modeClasses = `cursor-default border-2 border-dashed border-blue-900 bg-blue-500/70 pointer-events-none animate-pulse`; // Visible but non-interactive
        }
    } else {
        // View Mode
        modeClasses = `cursor-pointer border border-dashed border-black/40 bg-green-500/30 hover:bg-green-500/40 pointer-events-auto`;
    }

    const combinedClasses = `${baseClasses} ${modeClasses}`;

    // --- Inline styles ONLY for positioning/sizing ---
    const positionStyle: React.CSSProperties = {
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick(hotspot.id);
    };

    const handleHotspotClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container onClick if needed
        onClick(hotspot.id, hotspot.link_to_map_id); // Pass both ID and link
    };

    return (
        <Container
            key={hotspot.id}
            className={combinedClasses}
            style={positionStyle}
            onClick={handleHotspotClick}
            title={
                isEditMode
                    ? (editAction === 'selecting_for_deletion' ? `Select/Deselect Hotspot ID: ${hotspot.id}` : `Hotspot ID: ${hotspot.id}`)
                    : `Go to map: ${hotspot.link_to_map_id}`
            }
        >
            {/* Render Delete Button Conditionally */}
            {isSelected && editAction === 'selecting_for_deletion' && (
                <Button
                    variant="no-variant"
                    onClick={handleDeleteClick}
                    className="absolute px-3 py-1.5 -top-2 -right-2 w-3 h-6 bg-red-600 hover:bg-red-700 text-amber-50 border-2 border-red-800 rounded-full text-xs font-bold flex items-center justify-center leading-none cursor-pointer z-3 transition-colors duration-200 shadow-md pb-1.5 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                    title={`Delete hotspot ${hotspot.id}`}
                    aria-label={`Delete hotspot ${hotspot.id}`}
                >
                    X
                </Button>
            )}
            {/* Optional: Render hotspot ID - Maybe only if !isSelected? */}
            {/* {isEditMode && <span className="absolute top-0 left-0 text-[9px] bg-white/70 px-0.5 py-0">{hotspot.id}</span>} */}
            {/* {!isEditMode && <span className="absolute text-4xl font-bold top-0 left-0 text-[9px] bg-white/70 px-0.5 py-0.5">Click to Open!</span>} */}
        </Container>
    );
};

export default MapHotspotDisplay;