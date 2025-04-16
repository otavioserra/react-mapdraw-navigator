# Mapdraw - React Interactive PNG Map Navigator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
A flexible React component designed to display hierarchical PNG images and allow users to navigate through them interactively by clicking defined hotspot areas. Ideal for visualizing complex processes, service breakdowns, interactive documentation, or any multi-level visual information.

Built as part of the [Conn2flow](https://conn2flow.com) open-source ecosystem, but designed to be standalone and embeddable in various web projects.

## ✨ Features

* Displays PNG images dynamically based on a map ID.
* Fetches map data (image URL, hotspot coordinates) from a configurable API endpoint.
* Defines clickable rectangular **hotspots** on images.
* Supports **hierarchical navigation**: clicking a hotspot loads a linked child map/image.
* Maintains navigation **history** for easy "Back" functionality.
* Designed for **read-only** viewing (ideal for presentations, documentation, service exploration).
* Built with React functional components and hooks.

## 🚀 Installation (Coming Soon)

Mapdraw is currently under development. Once published as an NPM package, installation will be straightforward:

```bash
npm install react-mapdraw-navigator
# or
yarn add react-mapdraw-navigator