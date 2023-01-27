// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

application {
    mainClass.set("io.touca.apps.sample.StudentsTest")
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
    classpath = sourceSets["main"].runtimeClasspath
}
