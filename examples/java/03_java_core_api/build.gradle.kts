// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

application {
    mainClass.set("io.touca.examples.core.StudentsTest")
}

dependencies {
    implementation("io.touca:touca:1.5.0")
}

tasks.withType<Jar> {
    manifest {
        attributes["Main-Class"] = "io.touca.examples.core.StudentsTest"
    }
}

task<JavaExec>("runExampleCore") {
    main = "io.touca.examples.core.StudentsTest"
    classpath = sourceSets["main"].runtimeClasspath
}
