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
