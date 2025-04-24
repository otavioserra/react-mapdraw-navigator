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
    console.warn("Could not find #root element for Modal.setAppElement. Modals might have accessibility issues.");
    // Optionally set to body, but #root is preferred if it exists.
    // Modal.setAppElement(document.body);
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
        console.log(`Initializing Mapdraw instance ${index}...`);
        let initialJsonDataString: string | undefined = undefined;
        let rootMapId: string = DEFAULT_ROOT_MAP_ID; // Start with default

        const jsonContent = containerElement.textContent?.trim();
        const rootIdOverride = containerElement.dataset.mapdrawRootId; // Check for data-mapdraw-root-id attribute

        if (rootIdOverride) {
            rootMapId = rootIdOverride;
            console.log(`Instance ${index}: Using root ID from data attribute: ${rootMapId}`);
        }

        if (jsonContent && jsonContent.length > 0) { // Check if there is content
            try {
                // Validate and parse
                const parsedData = JSON.parse(jsonContent);
                if (typeof parsedData === 'object' && parsedData !== null && Object.keys(parsedData).length > 0) {
                    initialJsonDataString = jsonContent; // Use the valid JSON string
                    console.log(`Instance ${index}: Successfully parsed embedded JSON.`);

                    // If rootId wasn't overridden by data-attribute, try to infer it from the first key
                    if (!rootIdOverride) {
                        const firstKey = Object.keys(parsedData)[0];
                        if (firstKey) {
                            rootMapId = firstKey;
                            console.log(`Instance ${index}: Using first key '${rootMapId}' as root ID from JSON.`);
                        } else {
                            console.warn(`Instance ${index}: Embedded JSON has no keys, using default root ID '${rootMapId}'.`);
                        }
                    }

                    // Clear the div content *before* rendering React into it
                    containerElement.textContent = '';

                    // Create a React root *for this specific element*
                    const root = ReactDOM.createRoot(containerElement);
                    root.render(
                        <React.StrictMode>
                            <Mapdraw
                                rootMapId={rootMapId}
                                initialDataJsonString={initialJsonDataString}
                            // className if needed for Mapdraw container itself
                            // No onJsonFileSelected passed in this setup
                            />
                        </React.StrictMode>
                    );
                    console.log(`Instance ${index}: React Mapdraw initialized.`);

                } else {
                    console.warn(`Instance ${index}: Embedded JSON content is not a valid object or is empty.`);
                    containerElement.innerHTML = '<p style="color:orange; padding:10px;">Warning: Invalid embedded map data structure.</p>'; // Provide feedback
                }
            } catch (e) {
                console.error(`Instance ${index}: Failed to parse embedded JSON data:`, e);
                containerElement.innerHTML = '<p style="color:red; padding:10px;">Error: Failed to parse embedded map data.</p>'; // Provide feedback
            }
        } else {
            console.warn(`Instance ${index}: No JSON content found inside element. Cannot initialize Mapdraw with embedded data.`);
            // Optionally render Mapdraw with default data file?
            // Or display an error/message?
            containerElement.innerHTML = '<p style="color:grey; padding:10px;">Error: No map data found inside this element.</p>';
        }
    });
}