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
            const prepareAndStoreProps = async () => {
                containerElement.dataset.elementInitialized = 'true'; // Mark as processed by this script run
                // --- Add ID dynamically ---
                const elementId = containerElement.id || `react-mapdraw-navigator-${index + 1}`;
                containerElement.id = elementId;

                // --- Determine initialDataJsonString with priority ---
                let dataJsonString: string | undefined = undefined;
                const textContentJson = containerElement.textContent?.trim(); // Priority 1: Text content
                const jsonFileUrl = containerElement.dataset.mapdrawJsonFileUrl; // Priority 2: File URL attribute

                if (textContentJson && textContentJson.length > 0) {
                    try {
                        JSON.parse(textContentJson); // Validate if it's JSON
                        dataJsonString = textContentJson;
                        console.log(`Mapdraw [${elementId}]: Using textContent as JSON data.`);
                    } catch (e) {
                        console.warn(`Mapdraw [${elementId}]: textContent is not valid JSON. Will check for file URL. Error:`, e);
                        // If textContent is invalid, then try jsonFileUrl
                        if (jsonFileUrl) {
                            try {
                                const response = await fetch(jsonFileUrl);
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${jsonFileUrl}: ${response.statusText}`);
                                }
                                const fetchedJson = await response.text();
                                JSON.parse(fetchedJson); // Validate
                                dataJsonString = fetchedJson;
                                console.log(`Mapdraw [${elementId}]: Successfully loaded JSON data from URL: ${jsonFileUrl}`);
                            } catch (fetchError) {
                                console.error(`Mapdraw [${elementId}]: Error fetching or parsing JSON from URL '${jsonFileUrl}'. No external data will be used. Error:`, fetchError);
                            }
                        }
                    }
                } else if (jsonFileUrl) { // textContentJson is empty or not present, try file URL
                    try {
                        const response = await fetch(jsonFileUrl);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch ${jsonFileUrl}: ${response.statusText}`);
                        }
                        const fetchedJson = await response.text();
                        JSON.parse(fetchedJson); // Validate
                        dataJsonString = fetchedJson;
                        console.log(`Mapdraw [${elementId}]: Successfully loaded JSON data from URL: ${jsonFileUrl}`);
                    } catch (e) {
                        console.error(`Mapdraw [${elementId}]: Error fetching or parsing JSON from URL '${jsonFileUrl}'. No external data will be used. Error:`, e);
                    }
                }
                // If both are invalid/missing, dataJsonString remains undefined, hook will use its default.

                // --- Determine rootMapId ---
                const DEFAULT_ROOT_MAP_ID = 'rootMap';
                let finalRootMapId = containerElement.dataset.mapdrawRootId || DEFAULT_ROOT_MAP_ID;
                if (dataJsonString && !containerElement.dataset.mapdrawRootId) { // If data loaded and no override, try to infer
                    try {
                        const parsedData = JSON.parse(dataJsonString);
                        const firstKey = Object.keys(parsedData)[0];
                        if (firstKey) { finalRootMapId = firstKey; }
                    } catch (e) { /* Keep default/override if parsing fails */ }
                }

                // --- Config ---
                const baseWidth = parseInt(containerElement.dataset.baseWidth || '', 10) || DEFAULT_CANVAS_WIDTH;
                const baseHeight = parseInt(containerElement.dataset.baseHeight || '', 10) || DEFAULT_CANVAS_HEIGHT;
                const finalConfig = {
                    isAdminEnabled: containerElement.dataset.enableAdmin === 'true',
                    baseDims: { width: baseWidth, height: baseHeight }
                };

                // Clean div content (AFTER reading textContentJson) and remove hidden class
                containerElement.textContent = '';
                containerElement.classList.remove('hidden');

                // Store the props needed for rendering when element becomes visible
                elementPropsMap.set(containerElement, {
                    rootMapId: finalRootMapId,
                    initialDataJsonString: dataJsonString,
                    config: finalConfig
                });

                // Start observing the element
                observer.observe(containerElement);
                console.log(`Mapdraw [${elementId}]: Now observing for visibility.`);
            };

            prepareAndStoreProps(); // Call the async function to prepare props and start observing
        }
    });
}