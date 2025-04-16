# Mapdraw - React Interactive PNG Map Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
A flexible, **standalone** React component for displaying hierarchical PNG images and navigating through them interactively via clickable hotspots. Ideal for visualizing complex processes, service breakdowns, interactive documentation, or any multi-level visual information. **Manages map data client-side via JSON import/export.**

Built initially for the [Conn2flow](https://conn2flow.com) open-source ecosystem, but designed to be embeddable in various web projects without backend dependencies for map data in its core functionality.

## ✨ Features

* Displays PNG images dynamically based on internal map ID.
* Manages map structure (image URLs, hotspot coordinates, hierarchy) **client-side** within React state.
* Supports **JSON import/export** for persisting and sharing map structures easily.
* Defines clickable rectangular **hotspots** on images.
* Supports **hierarchical navigation**: clicking a hotspot loads a linked child map/image.
* Maintains navigation **history** for easy "Back" functionality.
* Includes **Viewer Mode** (read-only navigation - default).
* Includes **Admin Mode** (toggleable via prop) with UI for:
    * Adding/editing maps (Name, Image URL).
    * Visually defining/editing hotspots and their target links.
    * Importing/Exporting the entire map data as a `mapdata.json` file.
* Built with React functional components and hooks.

## 🚀 Installation (Coming Soon)

Mapdraw is currently under development. Once published as an NPM package:

```bash
npm install react-mapdraw-navigator
# or
yarn add react-mapdraw-navigator
```
## 💻 Basic Usage

```javascript
import React, { useState } from 'react';
import Mapdraw from 'react-mapdraw-navigator'; // Adjust path

// Optional: Load initial data from an imported JSON file or define here
// Ensure it follows the expected structure (see Data Persistence section)
// const initialData = { maps: [ { id: 'root', name: 'Root', imageUrl: '...', hotspots: [...] }, ... ] };
const initialData = null; // Or start empty

function MyMapViewer() {
  const [isAdmin, setIsAdmin] = useState(false); // Example state to toggle admin mode

  return (
    <div>
      {/* Example button to toggle admin mode */}
      <button onClick={() => setIsAdmin(!isAdmin)}>
        Toggle Admin Mode ({isAdmin ? 'ON' : 'OFF'})
      </button>

      <div style={{ width: '100%', maxWidth: '900px', height: '600px', margin: 'auto', border: '1px solid #eee', position: 'relative' /* Needed for potential overlays */ }}>
        <Mapdraw
          initialMapData={initialData} // Load data on init if available
          adminMode={isAdmin}
        />
      </div>
    </div>
  );
}

export default MyMapViewer;
```

💾 Data Persistence & Format (MVP)
In this initial version, Mapdraw manages map data client-side. To save and load your map structures, use the JSON Import/Export feature available in Admin Mode. The expected JSON structure to import/export is an object containing a `maps` array:

```json
{
  "maps": [
    {
      "id": "uniqueMapId1",
      "name": "Root Map Name",
      "imageUrl": "https://path/to/your/root-image.png",
      "hotspots": [
        {
          "id": "unique-hotspot-id-1",
          "x": 100, // Top-left X coordinate (relative to original image width)
          "y": 50,  // Top-left Y coordinate (relative to original image height)
          "width": 200,
          "height": 80,
          "targetMapId": "childMapId1" // ID of the map to navigate to
        }
        // ... more hotspots for this map
      ]
    },
    {
      "id": "childMapId1",
      "name": "Child Map 1 Name",
      "imageUrl": "https://path/to/your/child1-image.png",
      "hotspots": [
           // ... hotspots for child map 1
      ]
    }
    // ... more map objects
  ]
}
```

*(Future versions may explore optional backend integration).*

## ⚙️ Component Props (Initial)

* `initialMapData` (object | string | null, optional): An initial map data structure (JS object or JSON string adhering to the format above) to load when the component mounts. If null or undefined, starts empty (in Admin mode).
* `adminMode` (boolean, optional, default: `false`): Set to `true` to display the Admin UI for editing maps and hotspots.
* *(More props for customization like base styles, API endpoints (future), etc., can be added later).*

## 🤝 Contributing

Mapdraw is open source! Contributions, bug reports, and feature suggestions are welcome.

1. **Report Bugs:** Please open an issue on the GitHub repository.
2. **Suggest Features:** Open an issue with the tag "enhancement".
3. **Pull Requests:** Feel free to fork the repo and submit PRs. For significant changes, please discuss them in an issue first.

Please adhere to our Code of Conduct ([Link to Code of Conduct - Add Link Later]).

## 📄 License

Licensed under the MIT License. See the LICENSE file for details.

---

*Built with ❤️ for the Conn2flow ecosystem by Otávio Serra & AI Collaboration.## 📚 Roadmap*