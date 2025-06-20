// src/components/MapHotspotDisplay.tsx
import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Hotspot, EditAction } from '../hooks/useMapNavigation';
import Button from './Button';
import Container from './Container';
import { useMapInstanceContext } from '../contexts/MapInstanceContext';

interface MapHotspotDisplayProps {
    hotspot: Hotspot;
    isEditMode: boolean;
    editAction: EditAction;
    isSelected: boolean;
    onClick: (hotspotId: string) => void; // Alterado para apenas hotspotId
    onDeleteClick: (id: string) => void;
    scale: number;
}

const MapHotspotDisplay: React.FC<MapHotspotDisplayProps> = ({
    hotspot,
    isEditMode,
    editAction,
    isSelected,
    onClick,
    onDeleteClick,
    scale = 1
}) => {
    const { rootContainerElement } = useMapInstanceContext();

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
        } else if (editAction === 'selecting_for_edit') {
            modeClasses = `cursor-pointer border-2 border-dashed border-blue-700 bg-blue-500/70 hover:bg-blue-500/40 pointer-events-auto animate-pulse`;
        } else { // isEditMode but action is 'none'
            modeClasses = `cursor-default border-2 border-dashed border-yellow-700 bg-yellow-500/70 pointer-events-none animate-pulse`; // Visible but non-interactive
        }
    } else {
        // View Mode
        modeClasses = `cursor-pointer border-5 border-dashed border-green-500 bg-green-600/10 hover:bg-green-500/40 pointer-events-auto`;
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
        onClick(hotspot.id); // Passa apenas o ID do hotspot
    };

    // Calculate tooltip content dynamically
    let tooltipText: string;
    if (isEditMode) {
        const displayName = hotspot.title || hotspot.id;
        if (editAction === 'selecting_for_deletion' && isSelected) {
            tooltipText = isSelected ? `Deselect: ${displayName}` : `Select to Delete: ${displayName}`;
        } else if (editAction === 'selecting_for_deletion' && !isSelected) {
            tooltipText = `Select to Delete: ${displayName}`; // Tooltip for selecting for deletion
        } else if (editAction === 'selecting_for_edit' || editAction === 'editing_hotspot') {
            tooltipText = `Select to Edit: ${displayName}`; // Tooltip for selecting for edit
        } else {
            tooltipText = `Hotspot: ${displayName}`; // Generic edit mode
        }
    } else {
        tooltipText = hotspot.title || (hotspot.linkType === 'map' && hotspot.link_to_map_id ? `Go to map: ${hotspot.link_to_map_id}` : (hotspot.linkType === 'url' && hotspot.linkedUrl ? `Open URL: ${hotspot.linkedUrl}` : `Hotspot: ${hotspot.id}`));
    }

    let title = hotspot.title || hotspot.id; // For HTML title attribute if no Radix tooltip
    if (tooltipText) {
        title = '';
    }

    const deleteStyle: React.CSSProperties = {
        fontSize: '25px',
        transform: `scale(${(scale < 0.7 ? 3 * (1 - scale) : scale)})`,
    };

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <Container
                    key={hotspot.id}
                    className={combinedClasses}
                    style={positionStyle}
                    onClick={handleHotspotClick}
                    title={title}
                >
                    {isSelected && editAction === 'selecting_for_deletion' && (
                        <Button
                            variant="no-variant"
                            onClick={handleDeleteClick}
                            style={deleteStyle}
                            className="absolute -top-7 -right-7 w-12 h-12 bg-red-600 hover:bg-red-700 text-amber-50 border-2 border-red-800 rounded-full font-bold flex items-center justify-center leading-none cursor-pointer z-20 transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                            aria-label={`Delete hotspot ${hotspot.id}`}
                        >
                            X
                        </Button>
                    )}
                </Container>
            </Tooltip.Trigger>
            <Tooltip.Portal container={rootContainerElement || undefined}>
                <Tooltip.Content
                    className="text-xs bg-gray-900 text-white rounded px-2 py-1 shadow-md select-none z-50" // Style for tooltip
                    sideOffset={5}
                    align="center"
                >
                    {tooltipText}
                    <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
};

export default MapHotspotDisplay;