// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath(kotlin("gradle-plugin", version="1.4.30"))
    }
}

allprojects {
    val release: String? by project
    val baseVersion: String? by project
    val suffix = if (release == "true") "" else "-SNAPSHOT"
    version = baseVersion + suffix
    group = "io.touca"
    description = "Touca SDK for Java"

    repositories {
        mavenCentral()
    }
}
