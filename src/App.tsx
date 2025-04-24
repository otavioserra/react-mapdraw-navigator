// src/App.tsx
import React, { useState, useCallback, ChangeEvent } from 'react';
import Mapdraw from './Mapdraw';
import Container from './components/Container'; // Import Container
import Heading from './components/Heading';   // Import Heading
import Footer from './components/Footer';     // Import Footer

function App() {
  // Default root map ID (used if no other data source provides one)
  const DEFAULT_ROOT_MAP_ID = 'rootMap'; // Ensure this exists in map-data.json

  // State for the *currently active* JSON data string (from file or embedded)
  // undefined means use the default data file inside the hook
  const [activeJsonDataString, setActiveJsonDataString] = useState<string | undefined>(undefined);

  // State for the root ID corresponding to the active data
  // TODO: This might need logic to be read from imported/embedded JSON
  const [activeRootMapId, setActiveRootMapId] = useState<string>(DEFAULT_ROOT_MAP_ID);

  // State for the key to force Mapdraw remount when data source changes
  const [mapKey, setMapKey] = useState<number>(Date.now());

  // --- File Import Handler ---
  const handleFileSelected = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const inputElement = event.target; // Keep ref to input element

    if (!file) {
      return;
    }

    console.log(`File selected: ${file.name}`);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          // Validate by parsing before setting state
          JSON.parse(text); // Will throw error if invalid JSON
          console.log("Successfully read and parsed JSON file.");

          // Update state with the new JSON string
          setActiveJsonDataString(text);

          // TODO: Ideally, parse 'text' again here to find the root map ID
          // within the loaded data structure if it's not always the same.
          // For now, we just re-use the default or last known root ID,
          // relying on the key change to force re-initialization.
          // setActiveRootMapId(findRootIdInJson(text)); // Example placeholder

          // CRITICAL: Change the key to force Mapdraw to remount and re-run the hook
          setMapKey(Date.now());

        } catch (err) {
          console.error("Failed to parse JSON file:", err);
          alert(`Error: Could not parse "${file.name}" as valid JSON.`);
        } finally {
          // Clear the file input value so the same file can be selected again
          if (inputElement) {
            inputElement.value = '';
          }
        }
      } else {
        console.error("FileReader result was not a string.");
        alert(`Error: Could not read content from "${file.name}".`);
        if (inputElement) {
          inputElement.value = '';
        }
      }
    };

    reader.onerror = (e) => {
      console.error("Failed to read file:", e);
      alert(`Error: Could not read the selected file "${file.name}".`);
      if (inputElement) {
        inputElement.value = '';
      }
    };

    reader.readAsText(file); // Read the file content
  }, []); // Empty dependency array is okay here

  return (
    // Use Container for the main app layout
    <Container className="App container mx-auto p-4">
      {/* Use Heading component */}
      <Heading level={1} className="text-2xl font-bold text-center mb-4">
        Map Navigator Application
      </Heading>

      {/* Render Mapdraw using state and key */}
      <Mapdraw
        key={mapKey} // Force re-render when data source changes
        rootMapId={activeRootMapId}
        initialDataJsonString={activeJsonDataString}
        onJsonFileSelected={handleFileSelected} // Pass the handler down
      // className prop if needed for Mapdraw itself
      />

      {/* Use Footer component */}
      <Footer className="text-center text-sm text-gray-500 mt-6">
        End of Mapdraw component area.
      </Footer>
    </Container>
  );
}

export default App;