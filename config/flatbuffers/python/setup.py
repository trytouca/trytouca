# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

"""Auto-generated python implementation of Touca FlatBuffers schema"""

from pathlib import Path

from setuptools import setup

version = "0.0.1"
repo_url = "https://github.com/trytouca/trytouca/tree/main/config/flatbuffers/python"

setup(
    name="touca-fbs",
    version=version,
    license="Apache-2.0",
    description="Auto-generated python implementation of Touca FlatBuffers schema",
    packages=["touca_fbs"],
    keywords=["touca"],
    long_description=Path(__file__).with_name("Readme.md").read_text("utf-8"),
    long_description_content_type="text/markdown",
    author="Touca, Inc.",
    author_email="support@touca.io",
    url=repo_url,
    download_url="{}/archive/{}.tar.gz".format(repo_url, version),
    project_urls={"Documentation": "https://touca.io/docs", "Source": repo_url},
    python_requires=">=3.6",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3 :: Only",
    ],
    install_requires=[],
    extras_require={"dev": ["black>=21.6b0", "isort>=5.10.1"]},
)
