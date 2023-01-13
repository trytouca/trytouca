# Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

from conans import ConanFile, CMake


class ToucaConan(ConanFile):
    name = "touca"
    homepage = "https://github.com/trytouca/trytouca/tree/main/sdk/cpp"
    description = "Touca SDK for C++"
    topics = ("regression-testing", "test-framework", "test-automation")
    license = "Apache-2.0"
    version = "1.6.0"
    author = "Touca, Inc. <hello@touca.io>"
    settings = "os", "compiler", "build_type", "arch"
    options = {
        "fPIC": [True, False],
        "shared": [True, False],
        "with_tests": [True, False],
        "with_cli": [True, False],
        "with_examples": [True, False],
        "with_runner": [True, False],
        "with_openssl": [True, False],
    }
    default_options = {
        "fPIC": True,
        "shared": False,
        "with_tests": False,
        "with_cli": False,
        "with_examples": False,
        "with_runner": True,
        "with_openssl": True,
    }
    generators = "cmake_find_package"
    exports_sources = [
        "CMakeLists.txt",
        "LICENSE",
        "README.md",
        "cmake/**",
        "include/**",
        "src/**",
        "tests/**",
        "cli/**",
    ]

    def requirements(self):
        self.requires("cpp-httplib/0.11.3")
        self.requires("flatbuffers/2.0.0")
        self.requires("fmt/8.0.1")
        self.requires("ghc-filesystem/1.5.12")
        self.requires("mpark-variant/1.4.0")
        self.requires("rapidjson/1.1.0")
        if (
            self.options.with_examples
            or self.options.with_runner
            or self.options.with_cli
        ):
            self.requires("cxxopts/3.0.0")

    def build_requirements(self):
        if self.options.with_tests:
            self.build_requires("catch2/2.13.9")

    def configure(self):
        self.options["fmt"].header_only = True
        self.options["flatbuffers"].header_only = True
        self.options["cpp-httplib"].with_openssl = self.options.with_openssl

    def _configure_cmake(self):
        cmake = CMake(self)
        cmake.definitions["TOUCA_BUILD_TESTS"] = self.options.with_tests
        cmake.definitions["TOUCA_BUILD_CLI"] = self.options.with_cli
        cmake.definitions["TOUCA_BUILD_EXAMPLES"] = self.options.with_examples
        cmake.definitions["TOUCA_BUILD_RUNNER"] = self.options.with_runner
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
            "mpark-variant::mpark-variant",
            "rapidjson::rapidjson",
        ]
        if (
            self.options.with_examples
            or self.options.with_runner
            or self.options.with_cli
        ):
            client_requirements.append("cxxopts::cxxopts")
        self.cpp_info.name = "touca"
        self.cpp_info.components["client"].names["cmake_find_package"] = "client"
        self.cpp_info.components["client"].libs = ["touca"]
        self.cpp_info.components["client"].requires = client_requirements
