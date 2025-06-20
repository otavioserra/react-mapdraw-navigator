# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-06-20

### Added
- Implemented persistence of zoom (scale) and pan (X, Y position) state for each map individually.
    - When returning to a previously visited map, the view is restored.
    - When visiting a map for the first time, it is adjusted to fit the container.
- Introduced `mapViewTransforms` state and `updateMapViewTransform` function in the `useMapNavigation` hook to manage transformations.
- Added `initialTransformForCurrentMap` and `onTransformChange` props to `MapImageViewer` to receive and save the transformation state.
- Defined `imgAnimationTime` constant (e.g., `1ms`) in `MapImageViewer` to stabilize the application of transformations.

### Changed
- **Improved Loading and Initialization Mechanism:**
    - The "Loading" indicator is now displayed correctly only during the loading and initial setup of a new map.
    - Implemented `isReadyToSaveChangesRef` logic in `MapImageViewer` to prevent premature saving of transformation state, avoiding the parent map's state from "leaking" to the child on the first navigation.
    - `handleImageLoad` in `MapImageViewer` now resets the library's transformation (`resetTransform(0)`) before applying the saved state or the initial fit.
- `imageChangeParams` in `MapImageViewer` now uses `imgAnimationTime` instead of `0` for the `setTransform` animation time.

### Fixed
- Corrected an issue where the parent map's transformation state could be incorrectly applied to a child map during the first navigation via a hotspot.
- Resolved timing issues in applying transformations that could occur with an animation time of `0`.
- Bug fix (commit `7561132`).

## [0.4.1] - 2025-06-17

### Added
- Enabled map data loading from an external JSON file URL (`data-mapdraw-json-file-url` attribute).
- Added `h-[1000px]` to Tailwind CSS safelist.

### Changed
- Refactored hotspot data normalization on load to ensure `linkType` compatibility.

### Fixed
- Prevented navigation to the root map immediately after adding a hotspot.

## [0.4.0] - 2025-05-12

### Added
- Implemented Edit Hotspot functionality and UI enhancements.
- Added Radix UI tooltips to map hotspots.
- Replaced button text with icons and added tooltips to controls.
- Implemented initial Zoom/Pan controls and stable drawing functionality.
- Added Loading Indicator during image loading.
- Added Admin Controls section (conditionally enabled).

### Changed
- Refactored Tailwind CSS configuration to include a safelist for external/responsive styling.
- Stabilized LoadingIndicator position and initialization timing.
- Stabilized core feature implementation.

### Fixed
- Ensured modal and tooltip visibility in fullscreen mode.
- Improved default canvas resolution.

## [0.3.0] - 2025-05-09

### Added
- Implemented root image change functionality for the root map.
- Added basic zoom controls and reset functionality.
- Added configuration loading via data attributes (`data-mapdraw-root-id`, `data-enable-admin`, `data-base-width`, `data-base-height`).
- Added conditional rendering for admin controls.
- Implemented initial integration of a zoom/pan library (`react-zoom-pan-pinch`).
- Added drawing calculation logic.

### Changed
- Moved zoom/pan controls to `AppControls` via a ref handle.
- Refactored `MapImageViewer` interactions to integrate with the zoom/pan library.

### Fixed
- Stabilized LoadingIndicator position and finalized core features related to loading.
- Ensured consistent zoom/pan reset on map navigation.
- Fixed build errors.

### CI
- Added/Updated GitHub Action workflow for release builds.

## [0.2.0] - 2025-04-25

### Added
- Implemented embedded JSON initialization from element text content.
- Implemented per-instance File Import functionality.
- Implemented hotspot deletion UI and logic.
- Introduced Edit Mode actions (`adding`, `selecting_for_deletion`, `selecting_for_edit`, `changing_root_image`, `editing_hotspot`).
- Implemented core edit mode, data handling, and export features.

### Changed
- Refactored components: `MapImageViewer`, `AppControls`, `Mapdraw`.
- Componentized `MapImageViewer` and applied Tailwind styling.
- Simplified new map modal and automated map ID generation.

### Fixed
- Resolved Tailwind CSS v4 integration issues with Vite.
- Corrected Tailwind CSS v4 configuration issues.
- Fixed a bug (commit `7468211`).

## [0.1.0] - 2025-04-24

### Added
- First MVP ready with basic navigation between maps via hotspots.
- Basic JSON map data structure defined.
- Test images stored at `public/images/maps`.
- Vite server configured to render the map.

### Changed
- Basic JSON map data updated for testing purposes.

## [0.0.x] - 2025-04-18

### Added
- Project skeleton created.
- React and Vite basic setup installed.
- Basic files generated.
- Initial README defined and updated.

### Docs
- README updated.
- First README defined.

