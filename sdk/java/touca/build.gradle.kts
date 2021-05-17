/*
 *
 */

version = "0.1.0"
group = "io.touca.tocua-client"

plugins {
    `java-library`
}

repositories {
    mavenCentral()
}

dependencies {
    api("org.apache.commons:commons-math3:3.6.1")
    implementation("com.google.guava:guava:30.0-jre")
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
