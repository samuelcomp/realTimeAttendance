// src/components/AttendanceList.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { motion } from 'framer-motion';

// Set up the connection to the server. Adjust the URL as needed.
const socket = io('http://192.168.2.142:9080', {
    transports: ['websocket', 'polling'], // Prefer WebSocket but fallback to polling if necessary
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});

function AttendanceList() {
    const [attendances, setAttendances] = useState([]);
    const [error, setError] = useState(null); // State to hold error details

    useEffect(() => {
        // Subscribe to the 'attendanceData' event to receive real-time updates
        socket.on('attendanceData', data => {
            setAttendances(prevAttendances => [...prevAttendances, data]);
            setError(null);  // Reset errors when data is successfully received
        });

        // Handle connection errors
        socket.on('connect_error', err => {
            setError(`Connection Error: ${err.message}`); // Display connection error messages
        });

        // Handle other socket errors
        socket.on('error', err => {
            setError(`Socket Error: ${err.message}`); // Display more general socket errors
        });

        // Log disconnections
        socket.on('disconnect', reason => {
            setError(`Disconnected: ${reason}`); // Inform the user of the disconnection
        });

        // Clean up function to remove event listeners when the component unmounts
        return () => {
            socket.off('attendanceData');
            socket.off('connect_error');
            socket.off('error');
            socket.off('disconnect');
        };
    }, []);

    return (
        <div>
            {error && <div className="error">Error: {error}</div>}  // Display any error messages
            {attendances.map((attendance, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                >
                    ID: {attendance.id}, Time: {new Date(attendance.timestamp).toLocaleString()}
                </motion.div>
            ))}
        </div>
    );
}

export default AttendanceList;
