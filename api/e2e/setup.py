# Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

"""End-to-end tests for Touca Server API"""

from setuptools import setup

setup(
    name="touca-e2e",
    python_requires=">=3.6",
    install_requires=["minio", "pymongo", "python-dotenv", "requests", "rich"],
    extras_require={"dev": ["black", "isort", "touca"]},
)
