import eventlet
eventlet.monkey_patch()  # Patch sockets to make them non-blocking

from flask import Flask, request
from flask_socketio import SocketIO, emit
from zk import ZK
import logging
import uuid

# Setup advanced logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Flask and Socket.IO setup
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

# Device configurations
devices = [
    {"ip": "192.168.0.113", "port": 4370},
    {"ip": "192.168.5.34", "port": 4371},
    {"ip": "192.168.5.36", "port": 4371},
    {"ip": "192.168.5.39", "port": 4371}
]

# Initialize connections dictionary
connections = {device['ip']: None for device in devices}

def try_connect_device(device):
    ip = device['ip']
    port = device['port']
    try:
        logger.info(f"Attempting to connect to {ip} on port {port}")
        zk = ZK(ip, port=port, timeout=5)
        conn = zk.connect()
        logger.info(f"Connected to ZK device at {ip} successfully!")
        connections[ip] = conn
        start_listening(ip, conn)
    except Exception as e:
        logger.error(f"Failed to connect to ZK device at {ip}: {e}")
        connections[ip] = None
        # Schedule a retry with a delay
        eventlet.spawn_after(10, try_connect_device, device)

def start_listening(ip, conn):
    """Start a separate greenlet for listening to each connected device."""
    def listen():
        try:
            logger.info(f"Listening for real-time attendance data from {ip}...")
            for attendance in conn.live_capture():
                if attendance is not None:
                    logger.info(f"Attendance captured: ID {attendance.user_id} at {attendance.timestamp} from {ip}")
                    socketio.emit('attendanceData', {
                        'device_id': ip,
                        'user_id': attendance.user_id,
                        'timestamp': str(attendance.timestamp)
                    }, namespace='/')
        except Exception as e:
            logger.error(f"Error capturing attendance from {ip}: {e}")
            connections[ip] = None
            eventlet.spawn_after(10, try_connect_device, {'ip': ip, 'port': devices[ip]['port']})
    eventlet.spawn(listen)

@app.route('/error')
def error_handling():
    return "An error occurred", 500

if __name__ == '__main__':
    for device in devices:
        try_connect_device(device)  # Initiate connection attempts at start
    socketio.run(app, host='192.168.0.32', port=8000)
