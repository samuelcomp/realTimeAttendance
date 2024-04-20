import eventlet
eventlet.monkey_patch()  # Patch sockets to make them non-blocking

from flask import Flask, request
from flask_socketio import SocketIO, emit
from zk import ZK, const
import logging
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask and Socket.IO setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

# Device configurations
devices = [
    {"ip": "192.168.0.113", "port": 4370},
    {"ip": "192.168.0.114", "port": 4370},
    {"ip": "192.168.0.115", "port": 4370},
    {"ip": "192.168.0.116", "port": 4370}
]
connections = {device['ip']: None for device in devices}

def try_connect_device(device):
    try:
        zk = ZK(device['ip'], port=device['port'])
        conn = zk.connect()
        logger.info(f"Connected to ZK device at {device['ip']} successfully!")
        connections[device['ip']] = conn
    except Exception as e:
        logger.error(f"Failed to connect to ZK device at {device['ip']}: {e}")
        connections[device['ip']] = None

def check_and_connect_devices():
    for device in devices:
        if connections[device['ip']] is None:
            logger.info(f"Attempting to connect to ZK device at {device['ip']}...")
            eventlet.spawn_n(try_connect_device, device)

@socketio.on('connect')
def handle_connect():
    ip_address = request.remote_addr
    mac_address = 'Unavailable'
    try:
        mac_address = uuid.UUID(int=uuid.getnode()).hex[-12:]
    except Exception:
        pass
    logger.info(f"Client connected with IP: {ip_address}, MAC: {mac_address}")
    eventlet.spawn_n(check_and_connect_devices)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected")

@app.route('/error')
def error_handling():
    return "An error occurred", 500

def send_attendance_data():
    # This function now only listens for attendance from connected devices.
    while True:
        for ip, conn in connections.items():
            # Check if there is a valid connection to the device
            if conn:
                try:
                    logger.info(f"Listening for attendance from {ip}...")
                    # Assuming 'live_capture' is a method that listens for real-time attendance data
                    for attendance in conn.live_capture():
                        if attendance is not None:
                            logger.info(f"Attendance captured: ID {attendance.user_id} at {attendance.timestamp} from {ip}")
                            # Emit attendance data to the front end or wherever it needs to be sent
                            socketio.emit('attendanceData', {'device_id': ip, 'user_id': attendance.user_id, 'timestamp': str(attendance.timestamp)}, namespace='/')
                except Exception as e:
                    # Log the error and consider reconnecting or resetting the connection
                    logger.error(f"Error capturing attendance from {ip}: {e}")
                    connections[ip] = None  # Reset the connection on error
                    check_and_connect_devices()  # Attempt to reconnect
        eventlet.sleep(1)  # Polling interval, adjust as needed for your use case


if __name__ == '__main__':
    socketio.start_background_task(send_attendance_data)
    socketio.run(app, host='0.0.0.0', port=8000)
