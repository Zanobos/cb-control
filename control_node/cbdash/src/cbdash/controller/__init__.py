from flask import current_app

from cbdash.controller.tlm import TelemetryController

class ControllerFactory(object):

    telemetry_controller_instance = None

    @staticmethod
    def telemetry_controller():
        if not ControllerFactory.telemetry_controller_instance:
            ControllerFactory.telemetry_controller_instance = TelemetryController()
        return ControllerFactory.telemetry_controller_instance

   
