# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

"""Touca SDK for Python."""

from pathlib import Path

from setuptools import setup


def get_version():
    content = Path(__file__).parent.joinpath("touca", "_transport.py").read_text()
    line = next(x for x in content.splitlines() if x.startswith("__version__"))
    return line.split('"' if '"' in line else "'")[1]


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
            "cli/results/*.py",
            "plugins/*.py",
        ]
    },
    keywords=["touca", "snapshot testing", "regression testing"],
    long_description=Path(__file__).with_name("README.md").read_text(),
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
        "Development Status :: 4 - Beta",
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
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3 :: Only",
    ],
    install_requires=[
        "touca-fbs==0.0.1",
        "urllib3>=1.26.9",
        "certifi>=2021.5.30",
        "flatbuffers>=2.0",
        # The core library has no dependency on dataclasses at the moment.
        # This may change in the future. For now, we are specifying this
        # dependency to allow users to run getting started examples that
        # may be using dataclasses.
        'dataclasses; python_version<"3.7"',
        "colorama>=0.4.4",
        "jsonschema",
        "packaging>=21.3",
        "py7zr>=0.18.5",
        "requests>=2.27.1",
        "rich>=12.5.1",
    ],
    extras_require={
        "dev": [
            "black>=21.6b0",
            "isort>=5.10.1",
            "pytest>=6.2.4",
            "pytest-cov>=4.0.0",
            "Sphinx>=4.0.2",
            "sphinx-rtd-theme>=0.5.2",
            "tox>=3.9.0",
        ]
    },
)
