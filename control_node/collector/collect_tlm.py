import time
import logging
import socket
import struct
from datetime import datetime
from influxdb import InfluxDBClient

UDP_PORT = 15000
FMT_TLM = 'Iff'

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger()

client = InfluxDBClient(host='localhost', port=8086)
client.switch_database('telemetry')
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP
sock.bind(('', UDP_PORT))

while True:

    data, addr = sock.recvfrom(1024) # buffer size is 1024 bytes
    time_now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')
    cb_num, tension, current = struct.unpack(FMT_TLM, data)
    LOGGER.info('Received data from {}'.format(cb_num))
    tlm_points = [
        {
            "measurement": "tlm",
            "tags": {
                "origin": "cb_{}".format(cb_num)
            },
            "time": time_now,
            "fields": {
                "tension": tension,
                "current": current
            }
        }
    ]
    client.write_points(tlm_points)


