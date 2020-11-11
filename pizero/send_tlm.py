import time
import logging
import socket
import struct
import random
import serial

UDP_IP = '192.168.178.201'
UDP_PORT = 15000
FMT_TLM = 'Iff'
CB_NUM = 1

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger()

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM) # UDP
# uncomment this and wun with sudo (or change owner to that file)
# ser = serial.Serial('/dev/ttyS0', 38400)

tension_adder = 80
# Here fake collection of tension and current ranges... in reality, collect data!
# I use something dynamic in order to see the data changing
def get_values():
    global tension_adder
    if tension_adder > 110:
        tension_adder = 80
    tension = tension_adder
    tension_adder += 1
    if tension > 95:
        current = random.randint(20,30)
    else:
        current = 0
    return tension, current

def get_real_values():
    global ser
    data = ser.read(8)
    tension, current = struct.unpack('ff', data)
    return tension, current

while True:
    tension, current = get_real_values()    
    data = struct.pack(FMT_TLM, CB_NUM, float(tension), float(current))
    sock.sendto(data, (UDP_IP, UDP_PORT))
    LOGGER.info('Sent {} V, {} A'.format(tension, current))
    time.sleep(2)

