import yaml
import os
import logging
basedir = os.path.abspath(os.path.dirname(__file__))

from flask import Flask

logging.basicConfig(level=logging.INFO)

class YamlConfig(object):

    def __init__(self, config_file):
        with open(config_file, 'r') as stream:
            config = yaml.safe_load(stream)
            if config is not None:
                for key, value in config.items():
                    setattr(self, key.upper(), value)

def create_app(config_class=None):

    app = Flask(__name__)

    config_file = os.environ.get('FLASK_CONFIG_FILE') or 'config.dev.yaml'
    config_class = config_class or YamlConfig(config_file)
    app.config.from_object(config_class)

    from cbdash.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app
