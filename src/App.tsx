// src/App.tsx
import React from 'react';
import Mapdraw from './Mapdraw'; // Import the new component
import './App.css'; // Make sure this imports Tailwind directives if not done in index.css/main.tsx

function App() {
    // Define the root map ID - replace with your actual starting map ID from your JSON
    const ROOT_MAP_ID = 'rootMap'; // This ID must exist as a key in your map data (file or inline)

    // --- Example: How to use the initialDataJsonString prop ---
    const useInlineData = false; // Set to true to test inline data

    const inlineJsonData = `{
      "startPoint": {
        "imageUrl": "/images/maps/root.png",
        "hotspots": [
          { "id": "inline_hs1", "x": 10, "y": 10, "width": 20, "height": 15, "link_to_map_id": "detailView" }
        ]
      },
      "detailView": {
        "imageUrl": "/images/maps/childA.png",
        "hotspots": []
      }
    }`;
    const inlineRootId = "startPoint"; // The root ID MUST exist in the inline JSON

    return (
        // Using Tailwind classes for basic layout and styling
        <div className="App container mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-4">Map Navigator Application</h1>

            {/* Conditionally render Mapdraw based on whether to use inline data or default (file) */}
            {useInlineData ? (
                <Mapdraw rootMapId={inlineRootId} initialDataJsonString={inlineJsonData} />
            ) : (
                <Mapdraw rootMapId={ROOT_MAP_ID} /> // Uses data from src/data/map-data.json by default
            )}

            {/* Other parts of your application can go here */}
            <footer className="text-center text-sm text-gray-500 mt-6">
                End of Mapdraw component area.
            </footer>
        </div>
    );
}

export default App;
