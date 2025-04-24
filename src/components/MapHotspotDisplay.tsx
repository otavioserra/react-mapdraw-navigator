// src/components/MapHotspotDisplay.tsx
import React from 'react';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import Button from './Button'; // Assuming Button component exists

interface MapHotspotDisplayProps {
    hotspot: Hotspot;
    isEditMode: boolean;
    editAction: EditAction;
    isSelected: boolean; // Is this the hotspot selected for deletion?
    onClick: (id: string, link: string) => void; // Handles both navigation and selection clicks
    onDeleteClick: (id: string) => void; // Handles delete button click
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
            modeClasses = `cursor-pointer border border-dashed border-red-500/70 bg-red-500/10 hover:bg-red-500/20 pointer-events-auto`;
            if (isSelected) {
                modeClasses = `cursor-pointer border-2 border-solid border-red-600 bg-red-500/40 pointer-events-auto shadow-lg shadow-red-500/50 ring-2 ring-red-400 ring-offset-1`; // Enhanced selected style
            }
        } else if (editAction === 'adding') {
            modeClasses = `cursor-default border border-dashed border-orange-400 bg-orange-500/10 pointer-events-none`; // Visible but non-interactive
        } else { // isEditMode but action is 'none'
            modeClasses = `cursor-default border border-dashed border-gray-400 bg-gray-500/10 pointer-events-none`; // Visible but non-interactive
        }
    } else {
        // View Mode
        modeClasses = `cursor-pointer border border-dashed border-black/40 bg-green-500/10 hover:bg-green-500/20 pointer-events-auto`;
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
        e.stopPropagation(); // Prevent hotspot onClick
        // Add confirmation dialog?
        // if (window.confirm(`Delete hotspot ${hotspot.id}?`)) {
        onDeleteClick(hotspot.id);
        // }
    };

    const handleHotspotClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent container onClick if needed
        onClick(hotspot.id, hotspot.link_to_map_id); // Pass both ID and link
    };

    return (
        <div
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
                // Using standard button + Tailwind for simplicity here,
                // but could use the reusable Button component if preferred
                <button
                    onClick={handleDeleteClick}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white border border-red-800 rounded-full text-xs font-bold flex items-center justify-center leading-none cursor-pointer z-10 shadow-md p-0 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                    title={`Delete hotspot ${hotspot.id}`}
                    aria-label={`Delete hotspot ${hotspot.id}`}
                >
                    X
                </button>
            )}
            {/* Optional: Render hotspot ID - Maybe only if !isSelected? */}
            {/* {isEditMode && <span className="absolute top-0 left-0 text-[9px] bg-white/70 px-0.5 py-0">{hotspot.id}</span>} */}
        </div>
    );
};

export default MapHotspotDisplay;