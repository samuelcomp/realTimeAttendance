import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion } from 'framer-motion';

const socket = io('http://localhost:8000', { timeout: 20000 });  // 20 seconds timeout

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
    
    const rotateAnimation = {
        initial: { rotate: 0 },
        animate: { rotate: 360 },
        transition: { duration: 2 }
    };

    return (
        <div>
            <h1>Attendance Records</h1>
            <ul>
                {attendances.map((attendance, index) => (
                    <motion.li key={index}
                        initial={rotateAnimation.initial}
                        animate={rotateAnimation.animate}
                        transition={rotateAnimation.transition}
                    >
                        User ID: {attendance.user_id}, Time: {attendance.timestamp}
                        {/* Display an animated image along with each attendance */}
                        <motion.img src="/path-to-your-image.jpg" alt="Attendance"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        />
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}

export default AttendanceDisplay;
