# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""Touca SDK for Python."""

import os
from setuptools import setup


def get_file_content(file_name):
    here = os.path.abspath(os.path.dirname(__file__))
    with open(os.path.join(here, file_name), "rb") as file:
        return file.read().decode("utf-8")


def get_version():
    for line in get_file_content("touca/__init__.py").splitlines():
        if line.startswith("__version__"):
            delimeter = '"' if '"' in line else "'"
            return line.split(delimeter)[1]
    raise RuntimeError("Unable to find version string.")


version = get_version()
repo_url = "https://github.com/trytouca/trytouca/tree/main/sdk/python"

setup(
    name="touca",
    version=version,
    license="Apache-2.0",
    description="Touca SDK for Python",
    packages=["touca"],
    package_data={
        "touca": [
            "py.typed",
            "cli/config/profile.schema.json",
            "cli/*.py",
            "plugins/*.py",
        ]
    },
    keywords=["touca", "snapshot testing", "regression testing"],
    long_description=get_file_content("README.md"),
    long_description_content_type="text/markdown",
    author="Touca, Inc.",
    author_email="support@touca.io",
    url=repo_url,
    download_url="{}/archive/{}.tar.gz".format(repo_url, version),
    project_urls={
        "Changelog": "{}/blob/master/Changelog.md".format(repo_url),
        "Documentation": "https://touca.io/docs",
        "Source": repo_url,
        "Twitter": "https://twitter.com/trytouca",
    },
    entry_points={"console_scripts": ["touca=touca.cli.__main__:main"]},
    python_requires=">=3.6",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3 :: Only",
    ],
    install_requires=[
        "urllib3",
        "certifi>=2021.5.30",
        "flatbuffers>=2.0",
        # The core library has no dependency on dataclasses at the moment.
        # This may change in the future. For now, we are specifying this
        # dependency to allow users to run getting started examples that
        # may be using dataclasses.
        'dataclasses; python_version<"3.7"',
        "colorama",
        "jsonschema",
        "loguru",
        "packaging",
        "py7zr",
        "requests",
    ],
    extras_require={
        "dev": [
            "black>=21.6b0",
            "pytest>=6.2.4",
            "pytest-cov>=2.12.1",
            "Sphinx>=4.0.2",
            "sphinx-rtd-theme>=0.5.2",
            "tox>=3.9.0",
        ]
    },
)
