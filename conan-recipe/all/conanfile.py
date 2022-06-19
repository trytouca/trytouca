from conans import ConanFile, CMake, tools


class ToucaConan(ConanFile):

    name = "touca"
    homepage = "https://github.com/trytouca/touca-cpp"
    description = "Touca Continuous Regression Testing SDK for C++"
    topics = ("regression-testing", "test-framework", "test-automation")
    url = "https://github.com/conan-io/conan-center-index"
    license = "Apache-2.0"
    exports_sources = ["CMakeLists.txt"]
    generators = "cmake", "cmake_find_package"
    settings = "os", "compiler", "build_type", "arch"
    options = {
        "shared": [True, False],
        "with_tests": [True, False],
        "with_utils": [True, False],
        "with_examples": [True, False],
        "with_framework": [True, False],
        "with_openssl": [True, False],
    }
    default_options = {
        "shared": False,
        "with_tests": False,
        "with_utils": True,
        "with_examples": False,
        "with_framework": True,
        "with_openssl": True,
    }

    _cmake = None

    _build_subfolder = "build_subfolder"
    _source_subfolder = "source_subfolder"

    def configure(self):
        self.options["fmt"].header_only = True
        self.options["flatbuffers"].header_only = True
        self.options["spdlog"].header_only = True
        self.options["cpp-httplib"].with_openssl = self.options.with_openssl

    def _configure_cmake(self):
        if self._cmake:
            return self._cmake
        cmake = CMake(self)
        cmake.definitions["TOUCA_BUILD_TESTS"] = self.options.with_tests
        cmake.definitions["TOUCA_BUILD_UTILS"] = self.options.with_utils
        cmake.definitions["TOUCA_BUILD_EXAMPLES"] = self.options.with_examples
        cmake.definitions["TOUCA_BUILD_FRAMEWORK"] = self.options.with_framework
        cmake.configure(build_folder=self._build_subfolder)
        self._cmake = cmake
        return self._cmake

    def requirements(self):
        self.requires("cpp-httplib/0.8.0")
        self.requires("flatbuffers/1.12.0")
        self.requires("fmt/7.1.2")
        self.requires("ghc-filesystem/1.4.0")
        self.requires("rapidjson/1.1.0")
        self.requires("spdlog/1.8.2")
        if (self.options.with_examples or self.options.with_framework or self.options.with_utils):
            self.requires("cxxopts/2.2.1")

    def build_requirements(self):
        if self.options.with_tests:
            self.build_requires("catch2/2.13.3")

    def source(self):
        tools.get(**self.conan_data["sources"][self.version], strip_root=True, destination=self._source_subfolder)

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
            "flatbuffers::flatbuffers",
            "fmt::fmt",
            "ghc-filesystem::ghc-filesystem",
            "rapidjson::rapidjson",
            "spdlog::spdlog",
        ]
        if (self.options.with_examples or self.options.with_framework or self.options.with_utils):
            client_requirements.append("cxxopts::cxxopts")
        self.cpp_info.name = "touca"
        self.cpp_info.components["client"].names["cmake_find_package"] = "client"
        self.cpp_info.components["client"].libs = ["touca_client"]
        self.cpp_info.components["client"].requires = client_requirements
        if self.options.with_framework:
            self.cpp_info.components["framework"].names["cmake_find_package"] = "framework"
            self.cpp_info.components["framework"].libs = ["touca_framework"]
            self.cpp_info.components["framework"].requires = ["client"]
