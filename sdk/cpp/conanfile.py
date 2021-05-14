#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

from conans import ConanFile, CMake

class ToucaConan(ConanFile):

    name = "touca"
    homepage = "https://touca.io"
    description = "client library for regression testing arbitrary execution workflows"
    topics = ( "regression-testing", "test-framework", "test-automation" )
    url = "https://docs.touca.io"
    license = "Apache-2.0"
    version ="1.4.0"
    author = "Pejman Ghorbanzade <pejman@touca.io>"
    settings = "os", "compiler", "build_type", "arch"
    options = {
        "shared": [ True, False ],
        "with_tests": [ True, False ],
        "with_utils": [ True, False ],
        "with_examples": [ True, False ],
        "with_framework": [ True, False ],
        "with_openssl": [ True, False ]
    }
    default_options = {
        "shared": False,
        "with_tests": False,
        "with_utils": False,
        "with_examples": False,
        "with_framework": False,
        "with_openssl": True
    }
    generators = "cmake_find_package"
    exports_sources = [
        "CMakeLists.txt", "cmake/**", "include/**",
        "src/**", "framework/**", "tests/**", "utils/**"
    ]

    def requirements(self):
        self.requires.add("cpp-httplib/0.8.0")
        self.requires.add("flatbuffers/1.12.0")
        self.requires.add("fmt/7.1.2")
        self.requires.add("ghc-filesystem/1.4.0")
        self.requires.add("rapidjson/1.1.0")
        self.requires.add("spdlog/1.8.2")
        if self.options.with_examples or self.options.with_framework or self.options.with_utils:
            self.requires.add("cxxopts/2.2.1")

    def build_requirements(self):
        if self.options.with_tests:
            self.build_requires("catch2/2.13.3")

    def configure(self):
        self.options["fmt"].header_only = True
        self.options["flatbuffers"].header_only = True
        self.options["spdlog"].header_only = True
        self.options["cpp-httplib"].with_openssl = self.options.with_openssl

    def _configure_cmake(self):
        cmake = CMake(self)
        cmake.definitions["TOUCA_BUILD_TESTS"] = self.options.with_tests
        cmake.definitions["TOUCA_BUILD_UTILS"] = self.options.with_utils
        cmake.definitions["TOUCA_BUILD_EXAMPLES"] = self.options.with_examples
        cmake.definitions["TOUCA_BUILD_FRAMEWORK"] = self.options.with_framework
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
            "cpp-httplib::cpp-httplib",
            "fmt::fmt",
            "flatbuffers::flatbuffers",
            "ghc-filesystem::ghc-filesystem",
            "rapidjson::rapidjson",
            "spdlog::spdlog"
        ]
        if self.options.with_examples or self.options.with_framework or self.options.with_utils:
            client_requirements.append("cxxopts::cxxopts")
        self.cpp_info.name = "touca"
        self.cpp_info.components["client"].names["cmake_find_package"] = "client"
        self.cpp_info.components["client"].libs = ["touca_client"]
        self.cpp_info.components["client"].requires = client_requirements
        if self.options.with_framework:
            self.cpp_info.components["framework"].names["cmake_find_package"] = "framework"
            self.cpp_info.components["framework"].libs = ["touca_framework"]
            self.cpp_info.components["framework"].requires = ["client"]
