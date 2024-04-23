import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './NavigationMenu.css';

const socket = io('http://192.168.0.32:8000', { timeout: 20000 });


function AttendanceDisplay() {
    const [devices, setDevices] = useState([
        { ip: '192.168.0.113', latestData: null, history: [] },
        { ip: '192.168.5.34', latestData: null, history: [] },
        { ip: '192.168.5.36', latestData: null, history: [] },
        { ip: '192.168.5.39', latestData: null, history: [] },
    ]);

    useEffect(() => {
        socket.on('connect', () => console.log('Connected to server'));
        socket.on('attendanceData', data => {
            console.log('Attendance data received:', data);
            setDevices(devs => devs.map(dev => {
                if (dev.ip === data.device_id) {
                    return { ...dev, latestData: data, history: [...dev.history, data] };
                }
                return dev;
            }));
        });
        socket.on('connect_error', error => console.log('Connection error:', error));

        return () => {
            socket.off('connect');
            socket.off('attendanceData');
            socket.off('connect_error');
        };
    }, []);

    return (
        <Router>
            <div>
                <h1 style={{ textAlign: 'center' }}>Attendance Application</h1>
                <nav className="navbar">
                    <ul>
                        <li><Link to="/">Current Attendance</Link></li>
                        <li><Link to="/history">Attendance History</Link></li>
                    </ul>
                </nav>
                <Routes>
                    <Route path="/history" element={<AttendanceHistory devices={devices} />} />
                    <Route path="/" element={<DeviceGrid devices={devices} />} />
                </Routes>
            </div>
        </Router>
    );
}

function DeviceGrid({ devices }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', padding: '20px' }}>
            {devices.map((device, index) =>
                device.latestData ? (
                    <DisplayCurrentAttendance key={index} attendance={device.latestData} />
                ) : (
                    <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <h3>Device {device.ip}</h3>
                        <p>No data available</p>
                    </motion.div>
                )
            )}
        </div>
    );
}

function DisplayCurrentAttendance({ attendance }) {
    const animateProps = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
        transition: { duration: 0.5 }
    };

    return (
        <motion.div {...animateProps} style={{ textAlign: 'center' }}>
            <h3>Device {attendance.device_id}</h3>
            <p>User ID: {attendance.user_id}</p>
            <p>Timestamp: {attendance.timestamp}</p>
            <motion.img src="/images/profile.png" alt="Profile Image" style={{ maxWidth: '100%', height: 'auto' }} />
        </motion.div>
    );
}

function AttendanceHistory({ devices }) {
    // Flattening all histories into one array for simpler table rendering
    const allAttendances = devices.reduce((acc, device) => {
        const deviceHistory = device.history.map(attendance => ({
            ...attendance,
            deviceIp: device.ip // Add the device IP to each attendance record
        }));
        return acc.concat(deviceHistory);
    }, []);

    return (
        <div>
            <h2 style={{ textAlign: 'center' }}>Attendance History</h2>
            {allAttendances.length > 0 ? (
                <table style={{ width: '100%', margin: '20px auto', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>User ID</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Device IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAttendances.map((attendance, index) => (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{attendance.user_id}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{attendance.timestamp}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{attendance.deviceIp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ textAlign: 'center' }}>No attendance data available.</p>
            )}
        </div>
    );
}



export default AttendanceDisplay;
