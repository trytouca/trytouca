// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

plugins {
    `java-library`
    jacoco
}

dependencies {
    implementation("com.google.code.gson:gson:2.8.8")
    implementation("com.google.flatbuffers:flatbuffers-java:2.0.3")
    testImplementation("junit:junit:4.13.1")
}

tasks.jar {
    manifest {
        attributes(mapOf("Implementation-Title" to project.name,
                         "Implementation-Version" to project.version))
    }
}

java {
    withSourcesJar()
    withJavadocJar()
}

tasks.jacocoTestReport {
    reports {
        xml.isEnabled = true
        html.isEnabled = true
    }
}

tasks {
    check {
        dependsOn(jacocoTestReport)
    }
}
