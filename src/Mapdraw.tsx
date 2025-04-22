import React, { useCallback, useState, ChangeEvent } from 'react';
import Modal from 'react-modal';
import MapImageViewer from './components/MapImageViewer';
import NavigationControls from './components/NavigationControls';
import { useMapNavigation, Hotspot } from './hooks/useMapNavigation';

interface RelativeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MapdrawProps {
    rootMapId: string;
    className?: string;
}

const Mapdraw: React.FC<MapdrawProps> = ({ rootMapId, className }) => {
    const {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspot,
    } = useMapNavigation(rootMapId);

    // State for Edit Mode
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    // --- State for Modal ---
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newHotspotRect, setNewHotspotRect] = useState<RelativeRect | null>(null);
    // --- State for Modal Input ---
    const [linkIdInput, setLinkIdInput] = useState(''); // Move input state here

    const handleHotspotClick = useCallback((mapId: string) => {
        if (!isEditMode) {
            navigateToChild(mapId);
        }
    }, [navigateToChild, isEditMode]);

    const handleHotspotDrawn = useCallback((relativeRect: RelativeRect) => {
        console.log('New Hotspot Drawn (Relative %):', relativeRect);
        setNewHotspotRect(relativeRect);
        setLinkIdInput(''); // Clear input when opening modal
        setIsModalOpen(true);
    }, []);

    // --- Modal Save Handler ---
    const handleModalSave = useCallback(() => { // No longer receives linkedMapId as argument
        const linkedMapId = linkIdInput.trim(); // Get value from input state
        if (!linkedMapId) {
            alert('Please enter a Map ID to link to.');
            return;
        }
        if (!newHotspotRect || !currentMapId || !addHotspot) return;

        const newHotspotId = `hs_${currentMapId}_${Date.now()}`;
        const newHotspot: Hotspot = {
            id: newHotspotId,
            link_to_map_id: linkedMapId,
            ...newHotspotRect,
        };
        addHotspot(newHotspot);
        console.log('Added new hotspot:', newHotspot);
        setIsModalOpen(false);
        // setNewHotspotRect(null); // Resetting rect is not strictly necessary here
    }, [newHotspotRect, currentMapId, addHotspot, linkIdInput]); // Add linkIdInput to dependencies

    // --- Modal Cancel/Close Handler ---
    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
        // setNewHotspotRect(null); // Resetting rect is not strictly necessary here
    }, []);

    const toggleEditMode = () => {
        setIsEditMode(prev => !prev);
    };

    const containerClasses = `mapdraw-container ${className || ''}`.trim();

    const editButtonStyle: React.CSSProperties = {
        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
        padding: '5px 10px', cursor: 'pointer',
        backgroundColor: isEditMode ? '#ffdddd' : '#ddffdd',
        border: '1px solid #ccc', borderRadius: '4px',
    };

    // --- Styles for react-modal (optional, can use CSS classes) ---
    const customModalStyles: ReactModal.Styles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        content: {
            position: 'relative', // Reset position
            inset: 'auto', // Reset inset
            border: '1px solid #ccc',
            background: '#fff',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '5px',
            outline: 'none',
            padding: '20px 30px',
            minWidth: '300px', // Example min width
            maxWidth: '500px', // Example max width
        },
    };
    // --- Styles for elements inside the modal ---
    const inputStyle: React.CSSProperties = {
        display: 'block', width: '100%', padding: '8px',
        marginBottom: '15px', border: '1px solid #ccc', borderRadius: '3px', boxSizing: 'border-box'
    };
    const buttonStyle: React.CSSProperties = {
        padding: '8px 15px', margin: '0 5px', cursor: 'pointer',
        border: '1px solid #ccc', borderRadius: '3px',
    };
    // --- End styles ---

    return (
        <div className={containerClasses} style={{ position: 'relative' }}>

            <button onClick={toggleEditMode} style={editButtonStyle}>
                {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </button>

            <NavigationControls
                onBack={navigateBack}
                isBackEnabled={canGoBack && !isEditMode}
            />

            {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red', margin: '10px 0' }}>Error: {error}</div>}

            {currentMapDisplayData && !error && (
                <MapImageViewer
                    key={currentMapId}
                    imageUrl={currentMapDisplayData.imageUrl}
                    hotspots={currentMapDisplayData.hotspots}
                    onHotspotClick={handleHotspotClick}
                    isEditMode={isEditMode}
                    onHotspotDrawn={handleHotspotDrawn}
                />
            )}

            {!currentMapDisplayData && !error && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Map data is not available. Ensure the rootMapId ('{rootMapId}') exists in map-data.json.
                </div>
            )}

            {/* Render the Modal using react-modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={handleModalCancel} // Function called on overlay click or ESC press
                style={customModalStyles} // Apply custom styles
                contentLabel="Link New Hotspot Modal" // Label for accessibility
            >
                {/* Modal Content */}
                <h3>Link New Hotspot</h3>
                <label htmlFor="linkIdInput">Enter Target Map ID:</label>
                <input
                    id="linkIdInput"
                    type="text"
                    value={linkIdInput} // Controlled by linkIdInput state
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkIdInput(e.target.value)} // Update state
                    style={inputStyle}
                    autoFocus
                />
                <div style={{ textAlign: 'right', marginTop: '10px' }}> {/* Align buttons right */}
                    <button onClick={handleModalSave} style={{ ...buttonStyle, backgroundColor: '#d4edda' }}>Save</button>
                    <button onClick={handleModalCancel} style={{ ...buttonStyle, backgroundColor: '#f8d7da', marginLeft: '8px' }}>Cancel</button>
                </div>
            </Modal>
        </div>
    );
};

export default Mapdraw;
