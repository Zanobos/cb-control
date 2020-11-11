from cbdash.api import bp
from cbdash.controller import ControllerFactory

from flask import jsonify

@bp.route('/hello-world', methods=['GET'])
def hello_world():
    tlm_ctrl = ControllerFactory.telemetry_controller()
    return jsonify({'status': tlm_ctrl.hello_world()})