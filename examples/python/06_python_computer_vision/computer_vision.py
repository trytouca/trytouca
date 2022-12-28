# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import json
from pathlib import Path

from roboflow import Roboflow

config = json.loads(Path("config.json").read_text())
rf = Roboflow(config["roboflow_api_key"])
project = rf.workspace().project(config["roboflow_project"])
model = project.version(config["roboflow_version"]).model
