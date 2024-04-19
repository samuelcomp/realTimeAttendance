import socketio
from zk import ZK
import eventlet
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Setup Socket.IO server
sio = socketio.Server(cors_allowed_origins='*', async_mode='eventlet', logger=True, engineio_logger=True)
app = socketio.WSGIApp(sio)

# IP and port configuration for the server
server_ip = '192.168.2.142'
server_port = 8000

# Connect to the ZK attendance device
zk = ZK('192.168.0.113', port=4370)
try:
    conn = zk.connect()
    logging.info("Connected to ZK device successfully")
except Exception as e:
    logging.error(f"Failed to connect to ZK device: {e}")
    exit(1)  # Exit if the connection to the ZK device fails

@sio.event
def connect(sid, environ):
    logging.info(f'Client connected {sid}')

@sio.event
def connect_error(sid, environ):
    logging.error(f'Connection error with {sid}')

@sio.event
def disconnect(sid):
    logging.info(f'Client disconnected {sid}')

def send_attendance():
    try:
        for attendance in conn.live_capture():
            if attendance is not None:
                timestamp = attendance.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                logging.info(f"Attendance captured: ID {attendance.user_id} at {timestamp}")
                sio.emit('attendanceData', {'id': attendance.user_id, 'timestamp': timestamp})
            else:
                logging.warning("No attendance data received.")
    except Exception as e:
        logging.error(f"Error in capturing attendance: {e}")

if __name__ == '__main__':
    logging.info(f"Starting server on {server_ip}:{server_port}")
    eventlet.wsgi.server(eventlet.listen((server_ip, server_port)), app)
