package io.touca.runner;

public enum Color {
    // Reset color
    RESET("\033[0m"),

    // Text color
    BLACK("\033[0;30m"),
    GREEN("\033[0;32m"),
    RED("\033[0;31m"),
    YELLOW("\033[0;33m"),

    // Background
    GREEN_BACKGROUND("\033[42m"),
    RED_BACKGROUND("\033[41m"),
    YELLOW_BACKGROUND("\033[43m");

    private final String code;

    Color(String code) {
        this.code = code;
    }

    @Override
    public String toString() {
        return code;
    }
}