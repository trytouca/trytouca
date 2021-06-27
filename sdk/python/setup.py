#!/usr/bin/env python

# Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

"""
Touca SDK for Python
"""

import os
from setuptools import setup


def get_file_content(file_name):
    here = os.path.abspath(os.path.dirname(__file__))
    with open(os.path.join(here, file_name), "rt") as file:
        return file.read()


version = "0.1.0"
repo_url = "https://github.com/trytouca/touca-python"

setup(
    name="touca",
    version=version,
    license="Apache-2.0",
    description="Touca SDK for Python",
    packages=["touca"],
    package_data={"touca": ["py.typed"]},
    keywords=["touca", "snapshot testing", "regression testing"],
    long_description=get_file_content("Readme.rst"),
    long_description_content_type="text/x-rst",
    author="Touca, Inc.",
    author_email="support@touca.io",
    url=repo_url,
    download_url="{}/archive/{}.tar.gz".format(repo_url, version),
    project_urls={
        "Source": repo_url,
        "Changelog": "{}/blob/master/CHANGELOG.rst".format(repo_url),
        "Documentation": "https://trytouca.readthedocs.io/en/stable/index.html",
    },
    python_requires=">=3.9",
    classifiers=[
        "Development Status :: 1 - Planning",
        "Topic :: Software Development :: Testing :: Acceptance",
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3 :: Only",
    ],
    install_requires=["urllib3", "flatbuffers<2.0"],
    setup_requires=[],
    tests_require=[],
    extras_require={
        "dev": [
            "black>=21.6b0",
            "certifi>=2021.5.30",
            "pytest>=6.2.4",
            "pytest-cov>=2.12.1",
            "Sphinx>=4.0.2",
            "sphinx-rtd-theme>=0.5.2",
        ]
    },
)
