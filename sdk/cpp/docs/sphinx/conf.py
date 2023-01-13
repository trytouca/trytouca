# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import subprocess
from pathlib import Path


def get_version():
    return ".".join(
        next(
            x
            for x in (
                Path(__file__)
                .parent.parent.parent.joinpath("include", "touca", "core", "config.hpp")
                .read_text()
            ).splitlines()
            if x.startswith(f"#define {element}")
        ).split()[2]
        for element in [
            "TOUCA_VERSION_MAJOR",
            "TOUCA_VERSION_MINOR",
            "TOUCA_VERSION_PATCH",
        ]
    )


Path(__file__).parent.parent.parent.joinpath("local", "docs").mkdir(
    parents=True, exist_ok=True
)
subprocess.call("cd ../..; doxygen docs/doxygen/Doxyfile", shell=True)

# -- Project information -----------------------------------------------------

project = "Touca SDK for C++"
copyright = "2023, Touca, Inc."
author = "Touca, Inc."

# The full version, including alpha/beta/rc tags
release = get_version()

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ["breathe", "m2r2"]

# Add any paths that contain templates here, relative to this directory.
templates_path = ["_templates"]

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
html_theme = "sphinx_rtd_theme"

# These paths are either relative to html_static_path
# or fully qualified paths (eg. https://...)
html_css_files = [
    "style.css",
]

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ["_static"]

html_logo = "_static/touca_logo_fgwt.svg"
html_favicon = "_static/favicon.ico"

# If true, links to the reST sources are added to the pages.
html_show_sourcelink = False

# If true, "Created using Sphinx" is shown in the HTML footer. Default is True.
html_show_sphinx = False

# enable rendering markdown files using m2r extension
source_suffix = [".rst", ".md"]

# Breathe Configuration
breathe_default_project = "touca"
breathe_projects = {"touca": "../../local/docs/xml"}
