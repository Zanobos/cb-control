## Installation instructions (in production)

- Create a virtualenv with python > 3.7
- Activate that virtualenv
- Install the wheel 
- Install the systemd service of this app

## Dev instructions (with poetry)

- Install poetry on your machine, if not already present, and configure it for python 3.7:
    - `curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3.7`
    - edit the file `~/.poetry/bin/poetry` and change the first line to: `#!/usr/bin/env python3.7`
    - NB: modify these steps as required for your desired python version, e.g. if you'll be using "python3" replace that in the commands
- Create a virtualenv with python 3.7^ inside the current repo (on *unix `virtualenv -p python3.7 venv`)
- Activate that virtualenv (on *unix `source venv/bin/activate`)
- Install the project dependencies by calling, inside the venv, `poetry install`



