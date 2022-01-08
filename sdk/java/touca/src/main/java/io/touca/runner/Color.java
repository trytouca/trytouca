package io.touca.runner;

public enum Color {
  // Reset color
  RESET("\033[0m"), // RESET

  // Text color
  BLACK("\033[0;30m"), // BLACK
  RED("\033[0;31m"), // RED
  GREEN("\033[0;32m"), // GREEN
  YELLOW("\033[0;33m"), // YELLOW

  // Background
  RED_BACKGROUND("\033[41m"), // RED
  GREEN_BACKGROUND("\033[42m"), // GREEN
  YELLOW_BACKGROUND("\033[43m"), // YELLOW

  // High Intensity
  BLACK_BRIGHT("\033[0;90m");

  private final String code;

  Color(String code) {
    this.code = code;
  }

  @Override
  public String toString() {
    return code;
  }
}
