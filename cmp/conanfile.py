#
# Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
#

from conans import ConanFile, CMake

class WeaselConan(ConanFile):

    name = "weasel_comparator"
    homepage = "https://getweasel.com"
    description = "weasel platform component for comparing submitted test results"
    topics = ( "regression-testing", "snapshot-testing", "test-framework", "test-automation" )
    url = "https://getweasel.com/docs"
    license = "Private"
    version ="1.2.1"
    author = "Pejman Ghorbanzade <pejman@getweasel.com>"
    settings = "os", "compiler", "build_type", "arch"
    generators = "cmake_find_package"

    def requirements(self):
        self.requires.add("weasel/1.2.1")
        self.requires.add("cxxopts/2.2.1")
        self.requires.add("fmt/7.1.2")

    def source(self):
        self.run("git clone https://github.com/getweasel/weasel.git")

    def configure(self):
        self.options["weasel"].shared = True
        self.options["weasel"].with_tests = False
        self.options["weasel"].with_utils = False
        self.options["weasel"].with_examples = False
        self.options["weasel"].with_framework = False

    def _configure_cmake(self):
        cmake = CMake(self)
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

    def imports(self):
        self.copy("*.so*", dst="../dist/lib", src="lib")
        self.copy("*.dylib*", dst="../dist/lib", src="lib")
        self.copy("*.dll", dst="..\bin\Release", src="bin")
