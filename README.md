# React Mapdraw Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A flexible React component for displaying hierarchical images (like PNGs or SVGs) and navigating through them interactively via clickable hotspots. Supports zoom, pan, editing hotspots, and multiple initialization methods. Ideal for visualizing complex processes, service breakdowns, interactive floor plans, or any multi-level visual information.

Built initially for the [Conn2flow](https://conn2flow.com) open-source ecosystem, but designed to be embeddable in various web projects.

## ✨ Features

* **Hierarchical Map Display:** Renders images based on map IDs defined in a data structure.
* **Interactive Hotspots:** Define clickable rectangular areas on images that link to other map IDs.
* **Client-Side Data:** Manages map structure (image URLs, hotspot coordinates, links) primarily client-side.
* **Multiple Initialization Methods:**
    * **Embedded HTML:** Load initial map data directly from JSON placed inside a designated HTML `div`.
    * **File Import/Export:** Load and save map structures using JSON files (via Admin Controls).
    * **Default Fallback:** Can use a default `map-data.json` file if no other data is provided.
* **Zoom & Pan:** Smooth zoom (mouse wheel, pinch) and pan (drag) functionality provided by `react-zoom-pan-pinch`. View resets on navigation.
* **Navigation History:** Supports "Back" button functionality.
* **Loading Indicator:** Displays while map images are loading.
* **Admin Controls (Optional):**
    * Conditionally enabled via HTML `data-enable-admin="true"` attribute.
    * Provides UI for:
        * Entering/Exiting Edit Mode.
        * Visually drawing new rectangular hotspots (triggers modal for details).
        * Selecting and deleting existing hotspots (with visual feedback and cascade option).
        * Importing map data from a JSON file.
        * Exporting the current map data structure to a JSON file.
* **Component-Based:** Built with React functional components and hooks (including custom hooks).
* **Styling:** Uses Tailwind CSS utility classes for base styling (can be customized).

## 🚀 Initialization & Usage

The primary way to use `react-mapdraw-navigator` is by placing designated `div` elements in your HTML and letting the initialization script (typically in `src/main.tsx`) render the component into them.

**1. HTML Setup (`index.html` or similar):**

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>Mapdraw Example</title>
    <link href="/dist/output.css" rel="stylesheet">
</head>
<body>
    <div
      class="react-mapdraw-navigator w-[800px] h-[600px] border border-gray-300 hidden"
      data-mapdraw-root-id="mapA"
      data-enable-admin="true"
    >
      {
        "mapA": { "imageUrl": "/images/mapA.png", "hotspots": [{"id":"hsA1","x":10,"y":20,"width":15,"height":10,"link_to_map_id":"mapB"}] },
        "mapB": { "imageUrl": "/images/mapB.png", "hotspots": [] }
      }
    </div>

    <div
      class="react-mapdraw-navigator w-full border border-blue-300 hidden"
      data-mapdraw-root-id="start"
    >
      {
        "start": { "imageUrl": "/images/campus.png", "hotspots": [] }
      }
    </div>

     <div class="react-mapdraw-navigator w-[600px] h-[400px] border border-green-300 hidden"></div>

    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

* **`class="react-mapdraw-navigator"`:** Required class to identify elements where the map should be rendered.
* **Embedded JSON:** Place the initial map data JSON directly as the text content of the div.
* **`data-mapdraw-root-id` (Optional):** Specifies the ID of the map to load first from the embedded JSON. If omitted, the initializer might try to use the first key found in the JSON or a hardcoded default.
* **`data-enable-admin="true"` (Optional):** Add this attribute to enable the Edit/Import/Export buttons. If omitted, only view/navigation controls are shown.
* **Other Classes (`w-[]`, `h-[]`, `border`, etc.):** Use standard (Tailwind) CSS classes to style the container's size and appearance.
* **`hidden`:** Add this class initially to prevent flashing of raw JSON. The initializer script (`main.tsx`) will remove it before rendering React.

**2. Initializer Script (`src/main.tsx`):**

The script finds all elements with `class="react-mapdraw-navigator"`, reads the embedded JSON and data attributes, and renders a `<Mapdraw />` component inside each one, passing the data as props. *(End users typically don't need to modify this).*

## 💾 Data Structure (JSON Format)

The component uses a `MapCollection` object structure, both for embedded data and for import/export files. This is a JavaScript object where keys are unique map IDs and values are `MapDefinition` objects.

```JSON
{
  "mapId1": {
    "imageUrl": "/path/to/image1.png",
    "hotspots": [
      {
        "id": "unique-hotspot-id-1a",
        "x": 10.5,
        "y": 25.0,
        "width": 15.2,
        "height": 8.0,
        "link_to_map_id": "mapId2"
      }
    ]
  },
  "mapId2": {
    "imageUrl": "https://example.com/image2.jpg",
    "hotspots": []
  }
}
```

* Coordinates (`x`, `y`) and dimensions (`width`, `height`) for hotspots are percentages relative to the container dimensions at the time of creation (based on the current working calculation).

## ⚙️ Component Props (`<Mapdraw />`)

While typically rendered by the initializer script, the `<Mapdraw />` component accepts these props if used directly:

* `rootMapId` (string, required): The ID of the map to display initially. Must exist in the data source.
* `initialDataJsonString` (string, optional): A JSON string containing the entire `MapCollection` data structure. If provided, it overrides the default internal data source. Used by the initializer script based on embedded data.
* `config` (object, optional): Configuration options read from `data-*` attributes by the initializer. Currently supports:
    * `isAdminEnabled` (boolean): If true, enables admin controls.
* `className` (string, optional): Additional CSS classes for the main `Mapdraw` container div rendered *by* the `Mapdraw` component itself (distinct from the `react-mapdraw-navigator` div).

## 🤝 Contributing

(Seção de Contribuição - manter ou adaptar conforme necessário)

## 📄 License

Licensed under the MIT License. See the LICENSE file for details.

---

*Built with ❤️ for the Conn2flow ecosystem by Otávio Serra & AI Collaboration.*

## 📚 Roadmap

* Investigate minor image positioning glitch (auto-centering/drifting).
* Refine hotspot editing UI/UX.
* Add option for different hotspot shapes (circle, polygon).
* Optional backend integration API for saving/loading map data.
* More customization options via props/config.