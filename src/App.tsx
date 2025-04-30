// src/App.tsx (Simplified - No longer manages Mapdraw state/rendering directly)
import React from 'react';
// Import structural components if App still provides overall page layout
import Container from './components/Container';
import Heading from './components/Heading';
import Footer from './components/Footer';

// App component might now just provide overall page structure,
// or could even be removed entirely if main.tsx handles everything.
function App() {

  // No map-specific state or handlers needed here anymore,
  // as main.tsx initializes Mapdraw instances directly.

  return (
    // Example: App provides the main page container and title/footer
    <Container className="App container mx-auto p-4">
      <Heading level={1} className="text-2xl font-bold text-center mb-4">
        Map Navigator Application
      </Heading>

      {/*
             Mapdraw instances are now rendered directly by main.tsx
             into elements with class="react-mapdraw-navigator".
             We don't render <Mapdraw /> here anymore unless this App component
             has a different purpose.
            */}

      <Footer className="text-center text-sm text-gray-500 mt-6">
        Application Footer (if needed)
      </Footer>
    </Container>
  );
}

export default App;