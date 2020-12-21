#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

from conans import ConanFile, CMake

class WeaselConan(ConanFile):

    name = "weasel"
    homepage = "https://getweasel.com"
    description = "client library for regression testing arbitrary execution workflows"
    topics = ( "regression-testing", "test-framework", "test-automation" )
    url = "https://getweasel.com/docs"
    license = "Apache-2.0"
    version ="1.2.1"
    author = "Pejman Ghorbanzade <pejman@getweasel.com>"
    settings = "os", "compiler", "build_type", "arch"
    options = {
        "shared": [ True, False ],
        "with_tests": [ True, False ],
        "with_utils": [ True, False ],
        "with_examples": [ True, False ],
        "with_framework": [ True, False ]
    }
    default_options = {
        "shared": False,
        "with_tests": False,
        "with_utils": False,
        "with_examples": False,
        "with_framework": False
    }
    generators = "cmake_find_package"
    exports_sources = [
        "CMakeLists.txt", "config/weasel.fbs",
        "include/**", "src/**", "framework/**", "tests/**", "utils/**"
    ]

    def requirements(self):
        self.requires.add("boost/1.71.0")
        self.requires.add("flatbuffers/1.12.0")
        self.requires.add("fmt/7.1.3")
        self.requires.add("rapidjson/1.1.0")
        if not self.options.shared:
            self.requires.add("libcurl/7.74.0")
        if self.options.with_examples or self.options.with_framework or self.options.with_utils:
            self.requires.add("cxxopts/2.2.1")

    def build_requirements(self):
        self.build_requires("flatc/1.12.0")
        if self.options.shared:
            self.build_requires("libcurl/7.74.0")
        if self.options.with_tests:
            self.build_requires("catch2/2.13.3")

    def _configure_cmake(self):
        cmake = CMake(self)
        cmake.definitions["WEASEL_BUILD_TESTS"] = self.options.with_tests
        cmake.definitions["WEASEL_BUILD_UTILS"] = self.options.with_utils
        cmake.definitions["WEASEL_BUILD_EXAMPLES"] = self.options.with_examples
        cmake.definitions["WEASEL_BUILD_FRAMEWORK"] = self.options.with_framework
        cmake.configure()
        return cmake

    def build(self):
        cmake = self._configure_cmake()
        cmake.build()

    def test(self):
        cmake = self._configure_cmake()
        cmake.test()

    def package(self):
        cmake = self._configure_cmake()
        cmake.install()

    def package_info(self):
        client_requirements = [
            "boost::boost",
            "fmt::fmt",
            "flatbuffers::flatbuffers",
            "rapidjson::rapidjson",
        ]
        if not self.options.shared:
            client_requirements.append("libcurl::libcurl")
        if self.options.with_examples or self.options.with_framework or self.options.with_utils:
            client_requirements.append("cxxopts::cxxopts")
        self.cpp_info.name = "weasel"
        self.cpp_info.components["client"].names["cmake_find_package"] = "client"
        self.cpp_info.components["client"].libs = ["weasel_client"]
        self.cpp_info.components["client"].requires = client_requirements
        if self.options.with_framework:
            self.cpp_info.components["framework"].names["cmake_find_package"] = "framework"
            self.cpp_info.components["framework"].libs = ["weasel_framework"]
            self.cpp_info.components["framework"].requires = ["client"]
