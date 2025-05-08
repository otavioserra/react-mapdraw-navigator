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

    // Add Map to temporarily store props for each element
    const elementPropsMap = new Map<Element, {
        rootMapId: string;
        initialDataJsonString?: string;
        config: { isAdminEnabled: boolean; baseDims: { width: number; height: number } };
    }>();

    // Define the Intersection Observer callback function
    const handleIntersection = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
        entries.forEach(entry => {
            const containerElement = entry.target as HTMLDivElement; // Cast element type

            // Check if the element is intersecting (visible) AND not already initialized
            if (entry.isIntersecting && !containerElement.dataset.reactMapdrawInitialized) {
                console.log("Element is visible, initializing React Mapdraw instance...");

                // Mark as initialized
                containerElement.dataset.reactMapdrawInitialized = 'true';

                // Retrieve stored props
                const props = elementPropsMap.get(containerElement);

                if (props) {
                    // Keep the React rendering logic
                    const root = ReactDOM.createRoot(containerElement);
                    root.render(
                        <React.StrictMode>
                            <MapdrawInstanceWrapper
                                containerElement={containerElement} // Pass element itself to wrapper
                                rootMapId={props.rootMapId}
                                initialDataJsonString={props.initialDataJsonString}
                                config={props.config}
                            />
                        </React.StrictMode>
                    );
                    console.log("React Mapdraw instance initialized.");
                } else {
                    console.error("Could not find props for containerElement in map.");
                }

                // Stop observing this element once initialized
                observer.unobserve(containerElement);
                elementPropsMap.delete(containerElement); // Clean up map entry
            }
        });
    };

    // Create the Intersection Observer instance
    const observer = new IntersectionObserver(handleIntersection, {
        root: null, // Observe intersection with viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% is visible (adjust if needed)
    });

    // Iterate over containers, store props, and start observing
    mapContainers.forEach((containerElement, index) => {
        // Only process elements not already marked (e.g., by previous script runs)
        if (!containerElement.dataset.elementInitialized) {
            containerElement.dataset.elementInitialized = 'true';
            // --- Add ID dynamically ---
            const elementId = `react-mapdraw-navigator-${index + 1}`;
            containerElement.id = elementId;

            // --- Read initial data/config needed by Wrapper ---
            const DEFAULT_ROOT_MAP_ID = 'rootMap';
            let rootMapId: string = DEFAULT_ROOT_MAP_ID;
            let initialDataJsonString: string | undefined = undefined;
            const rootIdOverride = containerElement.dataset.mapdrawRootId;
            const jsonContent = containerElement.textContent?.trim(); // Read BEFORE potentially clearing
            const baseWidth = parseInt(containerElement.dataset.baseWidth || '', 10) || DEFAULT_CANVAS_WIDTH;
            const baseHeight = parseInt(containerElement.dataset.baseHeight || '', 10) || DEFAULT_CANVAS_HEIGHT;
            const config = {
                isAdminEnabled: containerElement.dataset.enableAdmin === 'true',
                baseDims: { width: baseWidth, height: baseHeight }
            };

            if (rootIdOverride) { rootMapId = rootIdOverride; }
            if (jsonContent && jsonContent.length > 0) { /* ... parse json ... */
                try {
                    const parsedData = JSON.parse(jsonContent);
                    if (typeof parsedData === 'object' && parsedData !== null && Object.keys(parsedData).length > 0) {
                        initialDataJsonString = jsonContent;
                        if (!rootIdOverride) {
                            const firstKey = Object.keys(parsedData)[0];
                            if (firstKey) { rootMapId = firstKey; }
                        }
                    }
                } catch (e) { console.error("Failed to parse JSON in observer setup.", e); }
            }
            // --- End reading data ---

            // Clean div content and remove hidden to start.
            containerElement.textContent = '';
            containerElement.classList.remove('hidden');

            // Store the props needed for rendering later
            elementPropsMap.set(containerElement, { rootMapId, initialDataJsonString, config });

            // Start observing the element
            observer.observe(containerElement);
            console.log("Observing container element:", elementId);
        }
    });
}