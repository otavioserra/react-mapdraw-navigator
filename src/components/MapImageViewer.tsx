import React from 'react';
// Import Hotspot type from the hook or define it consistently here
import { Hotspot } from '../hooks/useMapNavigation';

interface MapImageViewerProps {
    imageUrl: string;
    hotspots: Hotspot[];
    onHotspotClick: (mapId: string) => void;
}

const MapImageViewer: React.FC<MapImageViewerProps> = ({
    imageUrl,
    hotspots,
    onHotspotClick,
}) => {
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        lineHeight: '0', // Prevent extra space below image container
    };

    const imageStyle: React.CSSProperties = {
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
    };

    const getHotspotStyle = (hotspot: Hotspot): React.CSSProperties => ({
        position: 'absolute',
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
        cursor: 'pointer',
        // Basic visual feedback - enhance with CSS classes
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        border: '1px dashed rgba(0, 0, 0, 0.4)',
        boxSizing: 'border-box',
        // Add a simple transition for hover
        transition: 'background-color 0.2s ease, border 0.2s ease',
    });

    // Basic hover effect using inline style state is complex.
    // Recommend using CSS Modules or styled-components for :hover styles.
    // Example placeholder for hover logic if needed (not recommended for inline):
    // const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

    return (
        <div style={containerStyle}>
            <img src={imageUrl} alt="Map Diagram" style={imageStyle} />
            {hotspots.map((hotspot) => (
                <div
                    key={hotspot.id} // Use the hotspot's unique ID as key
                    style={getHotspotStyle(hotspot)}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent potential parent clicks if nested
                        onHotspotClick(hotspot.link_to_map_id);
                    }}
                    title={`Go to map: ${hotspot.link_to_map_id}`}
                // onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                // onMouseLeave={() => setHoveredHotspot(null)}
                // style={hoveredHotspot === hotspot.id ? { ...getHotspotStyle(hotspot), backgroundColor: 'rgba(0, 255, 0, 0.3)' } : getHotspotStyle(hotspot)}
                // TODO: Add accessibility attributes (e.g., aria-label)
                // TODO: Implement better hover styling using CSS classes
                >
                    {/* Optional: Render hotspot ID or label inside */}
                    {/* <span style={{ fontSize: '10px', color: 'black', background: 'rgba(255,255,255,0.5)' }}>{hotspot.id}</span> */}
                </div>
            ))}
        </div>
    );
};

export default MapImageViewer;
