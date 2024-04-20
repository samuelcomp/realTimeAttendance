import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000', { timeout: 20000 });  // 20 seconds timeout
  // Change this URL/port if your server is running elsewhere

function AttendanceDisplay() {
    const [attendances, setAttendances] = useState([]);

    useEffect(() => {
        console.log('Attempting to connect to server...');
    
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    
        socket.on('attendanceData', data => {
            console.log('Attendance data received:', data);
            setAttendances(prevAttendances => [...prevAttendances, data]);
        });
    
        socket.on('connect_error', (error) => {
            console.log('Connection error:', error);
        });
    
        return () => {
            socket.off('connect');
            socket.off('attendanceData');
            socket.off('connect_error');
        };
    }, []);
    

    return (
        <div>
            <h1>Attendance Records</h1>
            <ul>
                {attendances.map((attendance, index) => (
                    <li key={index}>
                        User ID: {attendance.user_id}, Time: {attendance.timestamp}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AttendanceDisplay;
