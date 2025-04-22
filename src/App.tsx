import React from 'react';
import Mapdraw from './Mapdraw'; // Import the new component
import './App.css';

function App() {
    // Define the root map ID - replace with your actual starting map ID
    const ROOT_MAP_ID = 'rootMap'; // Example ID

    return (
        <div className="App">
            <h1>My Application with Map Navigator</h1>
            {/* Render the Mapdraw component, passing the root ID */}
            <Mapdraw rootMapId={ROOT_MAP_ID} />
            {/* Other parts of your application can go here */}
        </div>
    );
}

export default App;
