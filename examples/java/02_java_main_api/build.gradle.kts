// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

application {
    mainClass.set("io.touca.examples.main.StudentsTest")
}

dependencies {
    implementation("io.touca:touca:0.3.1")
}

tasks.withType<Jar> {
    manifest {
        attributes["Main-Class"] = "io.touca.examples.main.StudentsTest"
    }
}

task<JavaExec>("runExampleMain") {
    main = "io.touca.examples.main.StudentsTest"
    classpath = sourceSets["main"].runtimeClasspath
}
