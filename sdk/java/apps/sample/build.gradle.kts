// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

dependencies {
    implementation(project(":touca"))
}

tasks.withType<Jar> {
    manifest {
        attributes["Main-Class"] = "io.touca.apps.sample.StudentsTest"
    }
}

task<JavaExec>("runSampleApp") {
    mainClass.set("io.touca.apps.sample.StudentsTest")
    classpath = sourceSets["main"].runtimeClasspath
}
