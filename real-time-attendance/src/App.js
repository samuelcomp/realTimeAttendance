// src/App.js
import React from 'react';
import './App.css'; // Make sure to style your app appropriately
import AttendanceList from './components/AttendanceList';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Real-Time Attendance Tracker</h1>
            </header>
            <AttendanceList />
        </div>
    );
}

export default App;
