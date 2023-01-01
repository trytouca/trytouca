# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC
from typing import Dict


class CliCommand(ABC):
    def __init__(self, options: Dict):
        self.options = options
