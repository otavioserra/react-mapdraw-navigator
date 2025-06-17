// src/Mapdraw.tsx
import React, { useCallback, useState, ChangeEvent, FormEvent, useRef } from 'react';
import Modal from 'react-modal';
import MapImageViewer, { MapImageViewerRefHandle } from './components/MapImageViewer';
import AppControls from './components/AppControls';
import Container from './components/Container';
import Button from './components/Button';
import Heading from './components/Heading';
import Label from './components/Label';
import Input from './components/Input';
import Form from './components/Form';
import { useMapNavigation, Hotspot, MapCollection, HotspotLinkType, HotspotUrlTarget } from './hooks/useMapNavigation';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { useMapInstanceContext } from './contexts/MapInstanceContext';

// Define a simpler config type inline or separately
export interface MapdrawConfig {
    isAdminEnabled?: boolean;
    baseDims?: { width: number; height: number };
}

interface RelativeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MapdrawProps {
    rootMapId: string;
    className?: string;
    initialDataJsonString?: string;
    config?: MapdrawConfig;
    onHeightChange?: (height: number) => void;
    isFullscreenActive?: boolean;
    onToggleFullscreen?: () => void;
    isWindowMaximized?: boolean;
    onToggleWindowMaximize?: () => void;
}

const generateUniqueIdPart = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

const Mapdraw: React.FC<MapdrawProps> = ({
    rootMapId,
    className,
    initialDataJsonString,
    config,
    onHeightChange,
    isFullscreenActive,
    onToggleFullscreen,
    isWindowMaximized,
    onToggleWindowMaximize
}) => {
    const {
        currentMapId,
        currentMapDisplayData,
        navigateToChild,
        navigateBack,
        canGoBack,
        error,
        addHotspotAndMapDefinition,
        managedMapData,
        editAction,
        setEditAction,
        deleteHotspot,
        loadNewMapData,
        updateHotspotDetails,
        updateMapImageUrl
    } = useMapNavigation(rootMapId, initialDataJsonString);

    const { rootContainerElement } = useMapInstanceContext();

    // --- Component State ---
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [newHotspotRect, setNewHotspotRect] = useState<RelativeRect | null>(null);
    const [newMapUrlInput, setNewMapUrlInput] = useState('');
    const [pendingGeneratedMapId, setPendingGeneratedMapId] = useState<string | null>(null);
    const [newHotspotTitleInput, setNewHotspotTitleInput] = useState('');
    // Novos estados para o modal
    const [activeModalTab, setActiveModalTab] = useState<HotspotLinkType>('map');
    const [newLinkedUrlInput, setNewLinkedUrlInput] = useState('');
    const [newUrlTargetInput, setNewUrlTargetInput] = useState<HotspotUrlTarget>('_blank');

    const [hotspotToDeleteId, setHotspotToDeleteId] = useState<string | null>(null);
    const [hotspotToEditId, setHotspotToEditId] = useState<string | null>(null);
    const mapViewerRef = useRef<MapImageViewerRefHandle>(null);
    const [newRootUrlInput, setNewRootUrlInput] = useState('');

    // Configs
    const isAdminEnabled = config?.isAdminEnabled ?? false;
    const isCurrentlyOnRootMap = currentMapId === rootMapId;

    // --- Event Handlers ---
    const handleHotspotClick = useCallback((clickedHotspotId: string) => { // Parameter is hotspotId
        if (!currentMapId || !managedMapData || !managedMapData[currentMapId]) return;

        const map = managedMapData[currentMapId];
        const hotspot = map.hotspots.find(hs => hs.id === clickedHotspotId);

        if (!hotspot) {
            console.warn(`Hotspot with id ${clickedHotspotId} not found on map ${currentMapId}`);
            return;
        }

        // Prevent navigation if in certain edit modes
        if (isEditMode && (editAction === 'selecting_for_deletion' || editAction === 'adding' || editAction === 'selecting_for_edit')) {
            return;
        }

        if (hotspot.linkType === 'map' && hotspot.link_to_map_id) {
            if (!isEditMode || editAction === 'none') {
                navigateToChild(hotspot.link_to_map_id);
            }
        } else if (hotspot.linkType === 'url' && hotspot.linkedUrl) {
            if (!isEditMode || editAction === 'none') {
                window.open(hotspot.linkedUrl, hotspot.urlTarget || '_blank');
            }
        }
    }, [navigateToChild, isEditMode, editAction, currentMapId, managedMapData]);

    const handleHotspotDrawn = useCallback((rect: RelativeRect) => {
        // Only trigger if the current action is 'adding'
        if (editAction !== 'adding') {
            console.warn("Hotspot drawn but editAction is not 'adding'. Ignoring.");
            return; // Or provide user feedback
        }
        setNewHotspotRect(rect);
        const generatedMapId = `map_${generateUniqueIdPart()}`;
        setPendingGeneratedMapId(generatedMapId);
        setNewMapUrlInput('');
        setNewHotspotTitleInput('');
        setActiveModalTab('map'); // Padrão para aba de mapa
        setNewLinkedUrlInput('');
        setNewUrlTargetInput('_blank');
        setIsModalOpen(true);
    }, [editAction]); // Add editAction dependency

    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
        setNewHotspotRect(null);
        // Resetar todos os campos do modal
        setNewMapUrlInput('');
        setPendingGeneratedMapId(null); // Clear pending ID for new map
        setNewHotspotTitleInput('');
        setActiveModalTab('map'); // Default to map tab
        setNewLinkedUrlInput(''); // Clear URL input
        setNewUrlTargetInput('_blank'); // Reset URL target

        if (editAction === 'editing_hotspot') {
            setHotspotToEditId(null);
            // Volta para o modo de seleção se estava editando, ou 'none' se o usuário cancelou a adição.
            // Se estava adicionando, o editAction já é 'adding', não precisa mudar aqui.
            // Se estava editando, voltar para 'selecting_for_edit' ou 'none'
            setEditAction(isEditMode ? 'selecting_for_edit' : 'none'); // Ou apenas 'none' se preferir
        }
    }, [editAction, setEditAction, setHotspotToEditId, isEditMode]); // Added isEditMode

    const handleSelectHotspotForEditing = useCallback((selectedHotspotId: string) => {
        setHotspotToEditId(selectedHotspotId);

        // Directly find and populate for modal (handleInitiateEditHotspot modified)
        if (!currentMapId || !managedMapData || !managedMapData[currentMapId]) return;
        const map = managedMapData[currentMapId];
        const hotspotToEdit = map.hotspots.find(hs => hs.id === selectedHotspotId);

        if (!hotspotToEdit) {
            console.error("Selected hotspot for edit not found (in handleSelect).");
            return;
        }

        setNewHotspotRect({ x: hotspotToEdit.x, y: hotspotToEdit.y, width: hotspotToEdit.width, height: hotspotToEdit.height });
        setNewHotspotTitleInput(hotspotToEdit.title || '');
        setPendingGeneratedMapId(null); // Not generating new map ID when editing

        if (hotspotToEdit.linkType === 'map' && hotspotToEdit.link_to_map_id) {
            setActiveModalTab('map');
            const linkedMapDefinition = managedMapData[hotspotToEdit.link_to_map_id];
            setNewMapUrlInput(linkedMapDefinition?.imageUrl || '');
            setNewLinkedUrlInput('');
            setNewUrlTargetInput('_blank');
        } else if (hotspotToEdit.linkType === 'url') {
            setActiveModalTab('url');
            setNewLinkedUrlInput(hotspotToEdit.linkedUrl || '');
            setNewUrlTargetInput(hotspotToEdit.urlTarget || '_blank');
            setNewMapUrlInput('');
        }

        setEditAction('editing_hotspot'); // Now we are in editing_hotspot mode
        setIsModalOpen(true);

    }, [currentMapId, managedMapData, setEditAction]); // Removed direct setters from deps, they are part of the component's scope

    const handleModalSubmit = useCallback((event: FormEvent) => {
        event.preventDefault(); // Prevent default form submission

        if (editAction === 'editing_hotspot') {
            if (!currentMapId || !hotspotToEditId) {
                // This error should not happen if handleSelectHotspotForEditing logic is correct
                console.error("Editing hotspot, but currentMapId or hotspotToEditId is missing.");
                handleModalCancel();
                return;
            }
            // Ensure managedMapData is available
            const hotspotBeingEdited = managedMapData?.[currentMapId]?.hotspots.find(hs => hs.id === hotspotToEditId);
            if (!hotspotBeingEdited) {
                // Este erro também não deveria acontecer
                console.error("Hotspot to edit definition not found for update.");
                handleModalCancel();
                return;
            }

            const newTitleForHotspot = newHotspotTitleInput.trim() || undefined;

            if (activeModalTab === 'map') {
                const newImageUrlForLinkedMap = newMapUrlInput.trim();
                if (!hotspotBeingEdited.link_to_map_id) {
                    // If changing to 'map' and there was no link_to_map_id, should one be generated?
                    // For now, assume if it's 'map', link_to_map_id already exists or user can't change linked map ID here.
                    // This part might need more logic if we want to allow changing the linked map to a new one.
                    console.error("Cannot set to map link without a link_to_map_id.");
                    alert("Error: Linked map ID (link_to_map_id) is missing.");
                    return;
                }
                if (!newImageUrlForLinkedMap) {
                    alert("Image URL for the linked map cannot be empty.");
                    return;
                }
                try { new URL(newImageUrlForLinkedMap); } catch (_) { if (!newImageUrlForLinkedMap.startsWith('/')) { alert('Please enter a valid image URL for the linked map...'); return; } }


                updateHotspotDetails(currentMapId, hotspotToEditId, {
                    title: newTitleForHotspot,
                    linkType: 'map',
                    link_to_map_id: hotspotBeingEdited.link_to_map_id, // Keep the linked map ID
                    linkedUrl: undefined,
                    urlTarget: undefined
                });

                // Update the linked map's image URL if it changed
                const originalLinkedMapImageUrl = managedMapData?.[hotspotBeingEdited.link_to_map_id]?.imageUrl;
                if (originalLinkedMapImageUrl !== newImageUrlForLinkedMap) {
                    updateMapImageUrl(hotspotBeingEdited.link_to_map_id, newImageUrlForLinkedMap);
                }
            } else { // activeModalTab === 'url'
                const newUrlToLink = newLinkedUrlInput.trim();
                if (!newUrlToLink) {
                    alert("The URL to link to cannot be empty.");
                    return;
                }
                try { new URL(newUrlToLink); } catch (_) { alert('Please enter a valid URL to link to...'); return; }

                updateHotspotDetails(currentMapId, hotspotToEditId, {
                    title: newTitleForHotspot,
                    linkType: 'url',
                    linkedUrl: newUrlToLink,
                    urlTarget: newUrlTargetInput,
                    link_to_map_id: undefined // Ensure link_to_map_id is removed/undefined
                });
            }

            handleModalCancel();
            setEditAction('selecting_for_edit'); // Revert to selection mode
            return;
        }

        // Logic to ADD new hotspot (editAction === 'adding')
        if (!currentMapId || !newHotspotRect) {
            console.error("Cannot add hotspot: missing currentMapId or hotspot rectangle data.");
            alert("An internal error occurred. Please try again.");
            handleModalCancel();
            return;
        }

        const newHotspotId = `hs_${currentMapId}_${generateUniqueIdPart()}`;
        let newHotspot: Hotspot;

        if (activeModalTab === 'map') {
            if (!pendingGeneratedMapId) {
                console.error("Submission failed: No generated Map ID available for map link.");
                alert("Internal error: Missing generated map ID. Please try again.");
                handleModalCancel();
                return;
            }
            const newMapImage = newMapUrlInput.trim();
            if (!newMapImage) {
                alert("Please fill in the Image URL for the new map.");
                return;
            }
            try { new URL(newMapImage); } catch (_) { if (!newMapImage.startsWith('/')) { alert('Please enter a valid image URL for the new map...'); return; } }

            newHotspot = {
                id: newHotspotId, ...newHotspotRect, title: newHotspotTitleInput.trim() || undefined,
                linkType: 'map', link_to_map_id: pendingGeneratedMapId,
            };
            addHotspotAndMapDefinition(currentMapId, newHotspot, newMapImage);
        } else { // activeModalTab === 'url'
            const urlToLink = newLinkedUrlInput.trim();
            if (!urlToLink) {
                alert("Please fill in the URL to link to.");
                return;
            }
            try { new URL(urlToLink); } catch (_) { alert('Please enter a valid URL to link to...'); return; }

            newHotspot = {
                id: newHotspotId, ...newHotspotRect, title: newHotspotTitleInput.trim() || undefined,
                linkType: 'url', linkedUrl: urlToLink, urlTarget: newUrlTargetInput,
            };
            addHotspotAndMapDefinition(currentMapId, newHotspot, ''); // Passa URL de imagem vazia, pois não cria novo mapa
            // For 'url' type, newMapImageUrl is not used by addHotspotAndMapDefinition
        }

        handleModalCancel();
        // After adding, revert to 'adding' mode to allow adding more, or 'none'?
        // setEditAction('adding'); // To continue adding
        // ou
        setEditAction('none'); // To revert to neutral edit state

    }, [
        currentMapId,
        newHotspotRect,
        pendingGeneratedMapId,
        newMapUrlInput,
        newHotspotTitleInput,
        addHotspotAndMapDefinition,
        handleModalCancel,
        managedMapData,
        editAction,
        hotspotToEditId,
        updateHotspotDetails,
        updateMapImageUrl,
        setEditAction, activeModalTab, newLinkedUrlInput, newUrlTargetInput
    ]);

    // Handler for when a hotspot is clicked in 'selecting_for_deletion' mode
    const handleSelectHotspotForDeletion = useCallback((hotspotId: string) => {
        setHotspotToDeleteId(prevId => (prevId === hotspotId ? null : hotspotId)); // Select or toggle deselect
    }, []);

    // Handler to clear the selection (e.g., clicking background)
    const handleClearDeletionSelection = useCallback(() => {
        setHotspotToDeleteId(null);
    }, []);

    // Handler to actually delete the selected hotspot
    const handleConfirmDeletion = useCallback((hotspotIdToDelete: string) => {
        if (!currentMapId) {
            console.error("Cannot delete hotspot: currentMapId is not set.");
            return;
        }
        deleteHotspot(currentMapId, hotspotIdToDelete);
        setHotspotToDeleteId(null); // Clear selection after deletion
    }, [currentMapId, deleteHotspot]);

    const toggleEditMode = useCallback(() => {
        setIsEditMode(prevIsEditMode => {
            const exitingEditMode = prevIsEditMode;
            if (exitingEditMode) {
                setEditAction('none'); // Reset action
                setHotspotToDeleteId(null); // Clear deletion selection when exiting edit mode
                setHotspotToEditId(null);   // Clear edit selection
            } else {
                // When entering edit mode, a default action can be set or left as 'none'
                // setEditAction('none'); // ou 'adding' se quiser que seja o padrão
            }
            return !prevIsEditMode;
        });
    }, [setEditAction]);

    // --- Keep handleExportJson function ---
    const handleExportJson = useCallback(() => {
        if (!managedMapData) return;
        try {
            const jsonString = JSON.stringify(managedMapData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'map-data.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) { console.error("Export failed:", err); }
    }, [managedMapData]);

    // --- File Import Handler (Now defined inside Mapdraw) ---
    const handleFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const inputElement = event.target; // Keep ref to input element

        if (!file) { return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                // Call the hook's function to load the new data
                loadNewMapData(text);
            } else {
                console.error("FileReader result was not a string.");
                alert(`Error: Could not read content from "${file.name}".`);
            }
            // Clear input value after processing
            if (inputElement) inputElement.value = '';
        };
        reader.onerror = (e) => {
            console.error("Failed to read file:", e);
            alert(`Error: Could not read the selected file "${file.name}".`);
            if (inputElement) inputElement.value = '';
        };
        reader.readAsText(file);
    }, [loadNewMapData]); // Dependency on the hook's function

    const handleZoomIn = useCallback(() => {
        mapViewerRef.current?.doZoomIn();
    }, []);

    const handleZoomOut = useCallback(() => {
        mapViewerRef.current?.doZoomOut();
    }, []);

    const handleResetTransform = useCallback(() => {
        mapViewerRef.current?.doResetTransform();
    }, []);

    const handleInitiateChangeRootImage = useCallback(() => {
        if (!currentMapId || currentMapId !== rootMapId) return; // Ensure we are on root map

        setNewRootUrlInput(currentMapDisplayData?.imageUrl || ''); // Pre-fill input
        setEditAction('changing_root_image'); // Set the new mode
        setHotspotToDeleteId(null); // Clear any deletion selection state

    }, [currentMapId, rootMapId, setEditAction, currentMapDisplayData?.imageUrl]);

    const handleConfirmChangeRootImage = useCallback(() => {
        // rootMapId comes from props (the initial root for this instance)
        if (!rootMapId) {
            console.error("Cannot change root image: Initial rootMapId is missing.");
            return;
        }

        const trimmedUrl = newRootUrlInput.trim();
        if (!trimmedUrl) {
            alert("Image URL cannot be empty.");
            return;
        }
        // Basic URL validation
        try { new URL(trimmedUrl); } catch (_) { if (!trimmedUrl.startsWith('/')) { alert('Invalid URL format.'); return; } }

        // --- Action: Create minimal data structure and call loadNewMapData ---
        console.log(`Attempting to reset map data with new root image for map '${rootMapId}': ${trimmedUrl}`);

        // 1. Create the minimal new map data object
        const newMapData: MapCollection = {
            [rootMapId]: { // Use the original rootMapId as the key
                imageUrl: trimmedUrl,
                hotspots: [] // Start with no hotspots
            }
        };

        // 2. Convert to JSON string
        const newJsonString = JSON.stringify(newMapData);

        // 3. Call the hook function to load this new structure, replacing everything else
        loadNewMapData(newJsonString);

        // --- End of new logic ---

        setEditAction('none'); // Exit the changing mode (loadNewMapData also does this, but explicit here is ok)
        setNewRootUrlInput(''); // Clear the input

    }, [rootMapId, newRootUrlInput, loadNewMapData, setEditAction]);

    const handleCancelChangeRootImage = useCallback(() => {
        setEditAction('none'); // Exit the changing mode
        setNewRootUrlInput(''); // Clear the input
    }, [setEditAction]);

    // --- Styling ---
    const containerClasses = `mapdraw-container relative ${className || ''}`.trim(); // Removed 'relative' as it might not be needed here anymore

    // --- Render Logic (Refactored) ---
    return (
        // Use Container for the main wrapper - pass computed className
        <TooltipProvider delayDuration={150}>
            <Container className={containerClasses}>
                <AppControls
                    onBack={navigateBack}
                    canGoBack={canGoBack}
                    isEditMode={isEditMode}
                    onToggleEditMode={toggleEditMode}
                    onExportJson={handleExportJson}
                    editAction={editAction}
                    setEditAction={setEditAction}
                    onJsonFileSelected={handleFileSelected}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetTransform={handleResetTransform}
                    isAdminEnabled={isAdminEnabled}
                    isCurrentlyOnRootMap={isCurrentlyOnRootMap}
                    onChangeRootImage={handleInitiateChangeRootImage} // Triggers the mode
                    newRootUrlInput={newRootUrlInput} // Input value state
                    onNewRootUrlChange={setNewRootUrlInput} // Input onChange handler (setter)
                    onConfirmChangeRootImage={handleConfirmChangeRootImage} // Save button handler
                    onCancelChangeRootImage={handleCancelChangeRootImage}
                    onHeightChange={onHeightChange}
                    isFullscreenActive={isFullscreenActive}
                    onToggleFullscreen={onToggleFullscreen}
                    isWindowMaximized={isWindowMaximized}
                    onToggleWindowMaximize={onToggleWindowMaximize}
                    hotspotToEditId={hotspotToEditId}
                />

                {/* Display Error Messages using Container */}
                {error && <Container variant="error-message">Error: {error}</Container>}

                {/* Display Map Viewer */}
                {currentMapDisplayData && !error && (
                    <MapImageViewer
                        ref={mapViewerRef}
                        imageUrl={currentMapDisplayData.imageUrl}
                        hotspots={currentMapDisplayData.hotspots}
                        onHotspotClick={handleHotspotClick}
                        isEditMode={isEditMode}
                        isModalOpen={isModalOpen}
                        onHotspotDrawn={handleHotspotDrawn}
                        editAction={editAction}
                        currentMapId={currentMapId}
                        hotspotToDeleteId={hotspotToDeleteId}
                        onSelectHotspotForDeletion={handleSelectHotspotForDeletion}
                        onClearSelection={handleClearDeletionSelection}
                        onConfirmDeletion={handleConfirmDeletion}
                        isFullscreenActive={isFullscreenActive}
                        isWindowMaximized={isWindowMaximized}
                        onSelectHotspotForEditing={handleSelectHotspotForEditing}
                    />
                )}

                {/* Display message if map data not available using Container */}
                {!currentMapDisplayData && !error && (
                    <Container variant="info-message">
                        Map data is not available...
                    </Container>
                )}

                {/* Modal using react-modal */}
                <Modal
                    isOpen={isModalOpen}
                    onRequestClose={handleModalCancel}
                    contentLabel={editAction === 'editing_hotspot' ? 'Edit Hotspot Details' : 'Add New Hotspot Details'}
                    className="m-auto bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 outline-none"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                    parentSelector={() => rootContainerElement || document.body}
                >
                    {/* Use Heading component */}
                    <Heading level={2} className="text-xl font-semibold mb-5 text-gray-800">
                        {editAction === 'editing_hotspot' ? 'Edit Hotspot Details' : 'Add New Hotspot Details'}
                    </Heading>

                    {/* Tabs to switch between link types */}
                    {editAction !== 'editing_hotspot' && ( // Show tabs only when adding, type is fixed by selection when editing
                        <Container variant="default" className="mb-4 flex border-b">
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('map')}
                                className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm ${activeModalTab === 'map' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Link to New Map
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('url')}
                                className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm ${activeModalTab === 'url' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                Link to URL
                            </button>
                        </Container>
                    )}

                    <Form onSubmit={handleModalSubmit}>
                        {/* Hotspot Title Field (common to both types) */}
                        <Container variant="form-group">
                            <Label htmlFor="hotspotTitle">Hotspot Title (Optional):</Label>
                            <Input type="text" id="hotspotTitle" value={newHotspotTitleInput} onChange={(e) => setNewHotspotTitleInput(e.target.value)} placeholder="Enter a display title" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" autoFocus={activeModalTab === 'map'} />
                        </Container>

                        {/* Fields for Link to New Map */}
                        {activeModalTab === 'map' && (
                            <>
                                {(editAction === 'adding' && pendingGeneratedMapId) && (
                                    <Container variant="default" className="mb-4">
                                        <p className="text-sm text-gray-600">
                                            Generated Map ID:
                                            <strong className="ml-2 font-mono select-all bg-gray-100 px-1 py-0.5 rounded">
                                                {pendingGeneratedMapId}
                                            </strong>
                                        </p>
                                    </Container>
                                )}
                                <Container variant="form-group">
                                    <Label htmlFor="mapImageUrl" className="block text-gray-700 text-sm font-medium mb-2">
                                        {editAction === 'editing_hotspot' ? 'Image URL for Linked Map:' : 'New Map Image URL:'}
                                    </Label>
                                    <Input type="text" id="mapImageUrl" value={newMapUrlInput} onChange={(e) => setNewMapUrlInput(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Enter image URL (http://... or /images/...)" required={activeModalTab === 'map'} autoFocus={activeModalTab === 'map' && !newHotspotTitleInput} />
                                </Container>
                            </>
                        )}

                        {/* Fields for Link to URL */}
                        {activeModalTab === 'url' && (
                            <>
                                <Container variant="form-group">
                                    <Label htmlFor="linkedUrl" className="block text-gray-700 text-sm font-medium mb-2">URL to Link:</Label>
                                    <Input type="url" id="linkedUrl" value={newLinkedUrlInput} onChange={(e) => setNewLinkedUrlInput(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="https://example.com" required={activeModalTab === 'url'} autoFocus={activeModalTab === 'url' && !newHotspotTitleInput} />
                                </Container>
                                <Container variant="form-group">
                                    <Label htmlFor="urlTarget" className="block text-gray-700 text-sm font-medium mb-2">Open Link In:</Label>
                                    <select id="urlTarget" value={newUrlTargetInput} onChange={(e) => setNewUrlTargetInput(e.target.value as HotspotUrlTarget)} className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                        <option value="_blank">New Tab/Window (_blank)</option>
                                        <option value="_self">Same Tab/Window (_self)</option>
                                    </select>
                                </Container>
                            </>
                        )}

                        {/* Use Container for modal actions */}
                        <Container variant="modal-actions">
                            {/* Use Button component for modal actions */}
                            <Button
                                type="button"
                                variant="default" // Or a specific 'cancel' variant if you add one
                                onClick={handleModalCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary" // Use primary variant
                            >
                                {editAction === 'editing_hotspot' ? 'Save Changes' : 'Add Hotspot'}
                            </Button>
                        </Container>
                    </Form>
                </Modal>
            </Container> // Close the outermost Container
        </TooltipProvider>
    );
};

export default Mapdraw;