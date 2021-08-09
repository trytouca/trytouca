/** Copyright 2021 Touca, Inc. Subject to Apache-2.0 License. */

package io.touca;

import java.util.List;

/**
 * Touca SDK for Java main API entry point.
 */
public final class Touca {

    private Touca() {
    }

    /**
     *
     */
    public static void configure(final Callback callback) {
        final Options options = new Options();
        callback.configure(options);
        Client.instance().configure(options);
    }

    /**
     *
     */
    public static boolean isConfigured() {
        return Client.instance().isConfigured();
    }

    /**
     *
     */
    public static String configurationError() {
        return Client.instance().configurationError();
    }

    /**
     *
     */
    public static void declareTestcase(final String name) {
        Client.instance().declareTestcase(name);
    }

    /**
     *
     */
    public static void forgetTestcase(final String name) {
        Client.instance().forgetTestcase(name);
    }

    /**
     *
     */
    public static <T> void addResult(final String name, final T value) {
        Client.instance().addResult(name, value);
    }

    /**
     *
     */
    public static void saveBinary(final String key, final List<String> cases) {
        Client.instance().saveJson(key, cases);
    }

    /**
     *
     */
    public static void saveJson(final String key, final List<String> cases) {
        Client.instance().saveJson(key, cases);
    }

    /**
     *
     */
    public static void post() {
        Client.instance().post();
    }

    /**
     *
     */
    public static void seal() {
        Client.instance().seal();
    }

    /**
     *
     */
    public interface Callback {
        void configure(Options options);
    }
}
