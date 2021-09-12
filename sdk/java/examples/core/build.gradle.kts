// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

application {
    mainClass.set("io.touca.examples.core.Main")
}

dependencies {
    implementation(project(":touca"))
}
