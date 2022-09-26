# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from roboflow import Roboflow
from pathlib import Path
import json

config = json.loads(Path("config.json").read_text())
rf = Roboflow(config["roboflow_api_key"])
project = rf.workspace().project(config["roboflow_project"])
model = project.version(2).model
