# -*- coding: utf-8 -*-
import eventlet
eventlet.monkey_patch()  # Important to patch sockets to make them non-blocking

from flask import Flask
from flask_socketio import SocketIO, emit
from zk import ZK, const
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask and Socket.IO setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

# Global variables for ZK Teco device connection
conn = None
zk = ZK('192.168.0.113', port=4370)

def connect_device():
    global conn
    try:
        conn = zk.connect()
        logger.info("Connected to the ZK device successfully! Waiting for attendance data...")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to the ZK device: {e}")
        return None

# Connect to the device at the start
conn = connect_device()

@socketio.on('connect')
def handle_connect():
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

def send_attendance_data():
    global conn
    if conn is None:
        logger.info("Attempting to reconnect to the ZK device...")
        conn = connect_device()
        if conn is None:
            logger.error("Reconnection failed. Attendance data cannot be captured.")
            return

    try:
        while True:
            for attendance in conn.live_capture():
                if attendance is not None:
                    logger.info(f"Attendance captured: ID {attendance.user_id} at {attendance.timestamp}")
                    emit('attendanceData', {'user_id': attendance.user_id, 'timestamp': str(attendance.timestamp)}, namespace='/')
            eventlet.sleep(0)  # yield to other sockets/processes
    except Exception as e:
        logger.error(f"Error capturing attendance: {e}")
        conn = None  # Reset connection on error

if __name__ == '__main__':
    if conn:
        socketio.start_background_task(send_attendance_data)  # Start the data capture in a non-blocking way
    socketio.run(app, host='0.0.0.0', port=8000)
