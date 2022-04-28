# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

from abc import ABC, abstractmethod
from argparse import ArgumentParser


class Operation(ABC):
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def parser(self) -> ArgumentParser:
        pass

    @abstractmethod
    def parse(self, args: list):
        pass

    @abstractmethod
    def run(self) -> bool:
        pass
