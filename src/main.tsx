// src/main.tsx (Updated to initialize multiple Mapdraw instances)
import React from 'react';
import ReactDOM from 'react-dom/client';
import Modal from 'react-modal';
import Mapdraw from './Mapdraw'; // Import Mapdraw directly
import './index.css'; // Your Tailwind/CSS imports

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


// --- Mapdraw Initialization Logic ---

// Default Root Map ID (fallback if not specified or found in JSON)
const DEFAULT_ROOT_MAP_ID = 'rootMap'; // Adjust if your default is different

// Find all elements designated to host a Mapdraw instance
const mapContainers = document.querySelectorAll<HTMLDivElement>('.react-mapdraw-navigator');

if (mapContainers.length === 0) {
    console.warn("No elements found with class 'react-mapdraw-navigator'. Mapdraw will not be initialized.");
    // If you still have other React content that should render in #root,
    // you could render <App /> here conditionally.
    // Example:
    // if (rootAppElement) {
    //    ReactDOM.createRoot(rootAppElement).render(<React.StrictMode><App /></React.StrictMode>);
    // }

} else {
    console.log(`Found ${mapContainers.length} Mapdraw instance(s) (using class 'react-mapdraw-navigator') to initialize.`);

    // Iterate over each container and render a Mapdraw instance
    mapContainers.forEach((containerElement, index) => {
        // --- Check if already initialized (from previous fix) ---
        if (!containerElement.dataset.reactMapdrawInitialized) {
            containerElement.dataset.reactMapdrawInitialized = 'true';

            console.log(`Initializing Mapdraw instance ${index}...`);
            let initialJsonDataString: string | undefined = undefined;
            let rootMapId: string = DEFAULT_ROOT_MAP_ID; // Start with default

            const jsonContent = containerElement.textContent?.trim();
            const rootIdOverride = containerElement.dataset.mapdrawRootId;

            // --- Step 1: Determine rootMapId and initialJsonDataString ---
            if (rootIdOverride) {
                rootMapId = rootIdOverride;
                console.log(`Instance ${index}: Using root ID from data attribute: ${rootMapId}`);
            }

            if (jsonContent && jsonContent.length > 0) {
                try {
                    const parsedData = JSON.parse(jsonContent);
                    if (typeof parsedData === 'object' && parsedData !== null && Object.keys(parsedData).length > 0) {
                        initialJsonDataString = jsonContent; // Use the valid JSON string
                        console.log(`Instance ${index}: Successfully parsed embedded JSON.`);
                        if (!rootIdOverride) { // Infer rootId only if not overridden
                            const firstKey = Object.keys(parsedData)[0];
                            if (firstKey) {
                                rootMapId = firstKey;
                                console.log(`Instance ${index}: Using first key '${rootMapId}' as root ID from JSON.`);
                            } else {
                                console.warn(`Instance ${index}: Embedded JSON has no keys, using default root ID '${rootMapId}'.`);
                            }
                        }
                    } else {
                        console.warn(`Instance ${index}: Embedded JSON content is not a valid object or is empty. Falling back to default data.`);
                        initialJsonDataString = undefined; // Fallback
                        rootMapId = DEFAULT_ROOT_MAP_ID;   // Fallback
                    }
                } catch (e) {
                    console.error(`Instance ${index}: Failed to parse embedded JSON data. Falling back to default data.`, e);
                    initialJsonDataString = undefined; // Fallback
                    rootMapId = DEFAULT_ROOT_MAP_ID;   // Fallback
                }
            } else {
                console.warn(`Instance ${index}: No JSON content found inside element. Using default data.`);
                initialJsonDataString = undefined; // Fallback
                rootMapId = DEFAULT_ROOT_MAP_ID;   // Fallback
            }

            // --- Step 2: Clean container and Render React (happens ONCE per element) ---
            containerElement.textContent = ''; // Clear container content
            const root = ReactDOM.createRoot(containerElement); // Create root
            root.render( // Render Mapdraw with determined props
                <React.StrictMode>
                    <Mapdraw
                        rootMapId={rootMapId}
                        initialDataJsonString={initialJsonDataString} // Will be undefined for default case
                    />
                </React.StrictMode>
            );
            console.log(`Instance ${index}: React Mapdraw initialized (Using ${initialJsonDataString ? 'embedded' : 'default'} data).`);

        }
    });
}