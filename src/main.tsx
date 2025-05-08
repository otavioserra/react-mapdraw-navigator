// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Modal from 'react-modal';
import MapdrawInstanceWrapper from './MapdrawInstanceWrapper';
import './index.css';
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from './contexts/MapInstanceContext';

// Set the app element for modal accessibility (using the original #root)
// This is important even if App isn't rendered directly into #root anymore,
// as modals rendered by Mapdraw might still need an app element defined.
const rootAppElement = document.getElementById('root');
if (rootAppElement) {
    Modal.setAppElement(rootAppElement);
} else {
    // Could not find #root element for Modal.setAppElement. Move Modals reference to 'document.body'.
    Modal.setAppElement(document.body);
}

// Find all elements designated to host a Mapdraw instance
const mapContainers = document.querySelectorAll<HTMLDivElement>('.react-mapdraw-navigator');

if (mapContainers.length === 0) {
    console.warn("No elements found with class 'react-mapdraw-navigator'. Mapdraw will not be initialized.");
} else {
    console.log(`Found ${mapContainers.length} Mapdraw instance(s) (using class 'react-mapdraw-navigator') to initialize.`);

    // Iterate over each container and render a MapdrawInstanceWrapper instance
    mapContainers.forEach((containerElement, index) => {
        if (!containerElement.dataset.reactMapdrawInitialized) {
            console.log(`Initializing Mapdraw instance ${index}...`);
            containerElement.dataset.reactMapdrawInitialized = 'true';

            // --- Read Initial Config Once ---
            const DEFAULT_ROOT_MAP_ID = 'rootMap';
            let rootMapId: string = DEFAULT_ROOT_MAP_ID;
            const rootIdOverride = containerElement.dataset.mapdrawRootId;

            // --- Read Initial embedded JSON ---
            let initialJsonDataString: string | undefined = undefined;
            const jsonContent = containerElement.textContent?.trim();

            if (rootIdOverride) { rootMapId = rootIdOverride; }
            if (jsonContent && jsonContent.length > 0) {
                try {
                    const parsedData = JSON.parse(jsonContent);
                    if (typeof parsedData === 'object' && parsedData !== null && Object.keys(parsedData).length > 0) {
                        initialJsonDataString = jsonContent;
                        if (!rootIdOverride) {
                            const firstKey = Object.keys(parsedData)[0];
                            if (firstKey) { rootMapId = firstKey; }
                        }
                    }
                } catch (e) { console.error("Wrapper: Failed to parse JSON.", e); }
            }

            // --- Config defined ---
            const baseWidth = parseInt(containerElement.dataset.baseWidth || '', 10) || DEFAULT_CANVAS_WIDTH;
            const baseHeight = parseInt(containerElement.dataset.baseHeight || '', 10) || DEFAULT_CANVAS_HEIGHT;
            const config = {
                isAdminEnabled: containerElement.dataset.enableAdmin === 'true',
                baseDims: { width: baseWidth, height: baseHeight }
            };

            // --- Render and start MapdrawInstanceWrapper ---
            containerElement.textContent = '';
            containerElement.classList.remove('hidden');
            const root = ReactDOM.createRoot(containerElement);
            root.render(
                <React.StrictMode>
                    <MapdrawInstanceWrapper
                        containerElement={containerElement}
                        rootMapId={rootMapId}
                        initialDataJsonString={initialJsonDataString}
                        config={config}
                    />
                </React.StrictMode>
            );
        }
    });
}