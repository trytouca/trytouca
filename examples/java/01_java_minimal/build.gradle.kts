// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    java
    application
}

application {
    mainClass.set("io.touca.examples.minimal.PrimeTest")
}

dependencies {
    implementation("io.touca:touca:1.5.1")
}

tasks.withType<Jar> {
    manifest {
        attributes["Main-Class"] = "io.touca.examples.minimal.PrimeTest"
    }
}

task<JavaExec>("runExampleMinimal") {
    main = "io.touca.examples.minimal.PrimeTest"
    classpath = sourceSets["main"].runtimeClasspath
}
