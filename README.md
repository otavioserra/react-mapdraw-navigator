# React Mapdraw Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A flexible React component for displaying hierarchical images (PNG, SVG, JPG) and navigating through them interactively via clickable hotspots. Features comprehensive zoom/pan, dynamic loading, conditional admin controls for editing, and robust data management via embedded JSON or file import/export. Ideal for complex process visualization, interactive documentation, floor plans, and multi-level visual information.

Built initially for the [Conn2flow](https://conn2flow.com) open-source ecosystem, but designed to be embeddable in various web projects.

**Demo Online:** [https://otavio.conn2flow.com/plugins/react-mapdraw-navigator/latest/dist/](https://otavio.conn2flow.com/plugins/react-mapdraw-navigator/latest/dist/)

## ✨ Features

*   **Hierarchical Map Display:** Renders images based on map IDs.
*   **Interactive Hotspots:** Clickable rectangular areas linking to other maps or external URLs, with informational tooltips (using Radix UI).
*   **Client-Side Data Management:** Handles map structure (image URLs, hotspot data) client-side.
*   **Multiple Initialization Methods:**
    *   **Embedded JSON:** Loads initial map data directly from JSON within the component's `div` tag (Priority 1).
    *   **External JSON File:** Loads map data from a specified URL via the `data-mapdraw-json-file-url` attribute (Priority 2).
    *   **File Import:** Load map structures from a JSON file (via Admin Controls).
    *   **Default Fallback:** Can use an internally defined default map if no other data is provided.
*   **Persistent Zoom & Pan:** Smooth zoom and pan powered by `react-zoom-pan-pinch`. The view state (zoom/pan) for each map is saved and restored upon navigation.
*   **Fullscreen & Full Window Modes:** Toggle buttons to expand the viewer to fill the entire screen (native fullscreen API) or the browser window. The "Full Window" mode is compatible with `iframe` embedding.
*   **Navigation History:** Supports "Back" button functionality.
*   **Loading Indicator:** Displays while map images are loading, correctly centered and adapting to container size.
*   **Touch Support:** Enables drawing hotspots on touch devices, with fixes for common mobile browser issues (scroll prevention, pull-to-refresh).
*   **Admin Controls (Optional & Configurable):**
    *   Conditionally enabled via `data-enable-admin="true"` HTML attribute.
    *   UI features SVG icons for clarity and Radix UI tooltips.
    *   Buttons for "Enter/Exit Edit Mode", "Add Hotspot", "Select to Edit", "Select to Delete".
    *   Edit sub-mode buttons act as toggles.
    *   **Hotspot Creation:** Visually draw new hotspots. A modal allows linking to a new internal map (by providing an image URL) or to an external URL.
    *   **Hotspot Editing:** Select an existing hotspot to edit its title and the image URL of the map it links to.
    *   **Hotspot Deletion:** Select and confirm deletion of hotspots (includes simplified orphaned map cleanup).
    *   **Root Image Change:** Allows changing the image URL of the current root map (resets map structure).
    *   **Import/Export JSON:** Load and save the entire map data structure.
*   **Configurable Base Canvas:** Hotspot percentages are relative to configurable base dimensions (default 3840x2160 - UHD/4K, settable via `data-base-width`/`data-base-height` HTML attributes), ensuring coordinate stability across different display sizes.
*   **Component-Based Architecture:** Built with React, TypeScript, Vite, using functional components and hooks.
*   **Styling:** Uses Tailwind CSS, with a `safelist` configured for external embedding flexibility.

## 🚀 Initialization & Usage

The component is designed to be initialized by a script (e.g., `src/main.tsx`) that finds designated `div` elements in your HTML.

**1. HTML Setup (`index.html` or similar):**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mapdraw Example</title>
    <link href="/assets/index-YOUR_CSS_HASH.css" rel="stylesheet">
</head>
<body>
    <div
      class="react-mapdraw-navigator w-[800px] h-[610px] border border-gray-300 hidden"
      data-mapdraw-root-id="mapA"
      data-enable-admin="true"
      data-base-width="3840"
      data-base-height="2160"
    >
      {
        "mapA": {
          "imageUrl": "/images/mapA.png",
          "hotspots": [
            {
              "id":"hsA1", "title": "Go to B",
              "x":10, "y":20, "width":15, "height":10,
              "link_to_map_id":"mapB"
            }
          ]
        },
        "mapB": { "imageUrl": "/images/mapB.png", "hotspots": [] }
      }
    </div>

    <script type="module" src="/assets/index-YOUR_JS_HASH.js"></script>
</body>
</html>
```

*   **`class="react-mapdraw-navigator"`:** Required.
*   **Embedded JSON:** Initial map data (Priority 1).
*   **`data-mapdraw-root-id` (Optional):** Initial map ID.
*   **`data-enable-admin="true"` (Optional):** Enables admin UI.
*   **`data-base-width` / `data-base-height` (Optional):** Sets the reference dimensions for hotspot percentages (defaults to 3840x2160). Changing this after hotspots are created will misalign them.
*   **Styling Classes (`w-[]`, `h-[]`, etc.):** Define the display size of the map instance.
*   **`hidden`:** Prevents raw JSON flash; removed by the script.

**2. Initializer Script (`src/main.tsx`):**

Finds elements with `class="react-mapdraw-navigator"`, reads data attributes and embedded JSON, then renders a `<MapdrawInstanceWrapper />` (which sets up Context and `ResizeObserver`) which in turn renders `<Mapdraw />` for each.

#### Running in an Iframe (Optional)

To have the "Full Window" button maximize the Mapdraw component to fill the *entire parent window* (instead of just the `iframe` itself), you need to add a script to the parent page to handle the communication.

**Parent Page HTML Example:**

```html
<iframe id="my-mapdraw-iframe" src="/path/to/mapdraw.html" allowfullscreen></iframe>

<script>
  // The ID of the iframe containing the Mapdraw component
  const mapdrawIframeId = 'my-mapdraw-iframe';
  // The CSS class to apply to the iframe when maximized
  const maximizedClass = 'mapdraw-iframe-maximized';

  // Add styles for the maximized class
  const style = document.createElement('style');
  style.innerHTML = `.${maximizedClass} { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; border: none; z-index: 9999; }`;
  document.head.appendChild(style);

  window.addEventListener('message', (event) => {
    // IMPORTANT: For production, check event.origin to ensure messages are from a trusted source.
    // Example: if (event.origin !== 'https://your-domain.com') return;
    
    if (event.data && event.data.type === 'REQUEST_MAPDRAW_MAXIMIZE_TOGGLE') {
      const iframeElement = document.getElementById(mapdrawIframeId);
      if (iframeElement) {
        const shouldMaximize = event.data.maximize;
        iframeElement.classList.toggle(maximizedClass, shouldMaximize);
        // Notify the iframe of the status change
        iframeElement.contentWindow.postMessage({ type: 'MAPDRAW_MAXIMIZE_STATUS_UPDATE', isMaximized: shouldMaximize }, '*');
      }
    }
  });
</script>
```

## 💾 Data Structure (JSON Format)

A `MapCollection` object where keys are map IDs:

```json
{
  "mapId1": {
    "imageUrl": "/path/to/image1.png",
    "hotspots": [
      {
        "id": "unique-hotspot-id-1a",
        "title": "Optional Hotspot Title",
        "x": 10.5,
        "y": 25.0,
        "width": 15.2,
        "height": 8.0,
        "linkType": "map",
        "link_to_map_id": "mapId2",
        "linkedUrl": "https://example.com",
        "urlTarget": "_blank"
      }
      // ... more hotspots
    ]
  },
  "mapId2": {
    "imageUrl": "https://example.com/image2.jpg",
    "hotspots": []
  }
  // ... more map definitions
}
```

*   Hotspot `x, y, width, height` are percentages relative to the `baseDims` (default 3840x2160 or as configured by `data-base-width`/`height`).

## ⚙️ Configuration

Primary configuration is via HTML `data-*` attributes on the `.react-mapdraw-navigator` div:
*   `data-mapdraw-root-id`: (Optional) The ID of the map to load first.
*   `data-enable-admin`: (Optional, `true`|`false`) Enables admin controls. Defaults to `false`.
*   `data-base-width`: (Optional, number) Sets the reference width for hotspot percentage calculations.
*   `data-base-height`: (Optional, number) Sets the reference height for hotspot percentage calculations.
*   `data-mapdraw-json-file-url`: (Optional) URL to an external JSON file with map data (Priority 2, after embedded JSON).

These are read by `main.tsx` and passed down to the React components, partly via a `config` prop and partly via Context.

## 🤝 Contributing

Mapdraw is open source! Contributions, bug reports, and feature suggestions are highly welcome. Feel free to fork the repository, explore the code, and submit Pull Requests. For significant changes, please open an issue first to discuss your ideas.

If you'd like to discuss the project, have specific questions, or want to collaborate more directly, you can reach out to Otávio Serra on LinkedIn: https://www.linkedin.com/in/otaviocserra/.

## 📚 Roadmap

*   Investigate minor image positioning glitch (auto-centering/drifting, if still present).
*   Further refine hotspot editing UI/UX.
*   Add option for different hotspot shapes (circle, polygon).
*   Advanced cascading delete options.
*   More customization options for appearance and behavior.
*   Consider packaging as a reusable NPM library for easier integration into other React projects.

## 📄 License

Licensed under the MIT License. See the LICENSE file for details.

---

*Built with ❤️ for the Conn2flow ecosystem by Otávio Serra & AI Collaboration **{Gemini Pro 1.5}**.*
