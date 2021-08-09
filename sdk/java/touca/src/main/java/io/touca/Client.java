/** Copyright 2021 Touca, Inc. Subject to Apache-2.0 License. */

package io.touca;

import java.util.List;

public class Client {
    private static final Client instance = new Client();

    private Client() {
    };

    public static Client instance() {
        return instance;
    }

    /**
     *
     */
    public void configure(final Options options) {
    }

    /**
     *
     */
    public boolean isConfigured() {
        return false;
    }

    /**
     *
     */
    public String configurationError() {
        return "";
    }

    /**
     *
     */
    public void declareTestcase(final String name) {
    }

    /**
     *
     */
    public void forgetTestcase(final String name) {
    }

    /**
     *
     */
    public <T> void addResult(final String name, final T value) {
    }

    /**
     *
     */
    public void saveBinary(final String key, final List<String> cases) {
    }

    /**
     *
     */
    public void saveJson(final String key, final List<String> cases) {
    }

    /**
     *
     */
    public void post() {
    }

    /**
     *
     */
    public void seal() {
    }

}
