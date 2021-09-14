// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import java.util.ArrayList;

/**
 * Touca SDK for Java main API entry point.
 */
public final class Touca {

    /**
     *
     */
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
    public static Iterable<String> getTestCases() {
        return Client.instance().getTestCases();
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
    public static <T> void addResult(final String key, final T value) {
        Client.instance().addResult(key, value);
    }

    /**
     *
     */
    public static <T> void addAssertion(final String key, final T value) {
        Client.instance().addAssertion(key, value);
    }

    /**
     *
     */
    public static <T> void addArrayElement(final String key, final T value) {
        Client.instance().addArrayElement(key, value);
    }

    /**
     *
     */
    public static void addHitCount(final String key) {
        Client.instance().addHitCount(key);
    }

    /**
     *
     */
    public static void addMetric(final String key, final long milliseconds) {
        Client.instance().addMetric(key, milliseconds);
    }

    /**
     *
     */
    public static void startTimer(final String key) {
        Client.instance().startTimer(key);
    }

    /**
     *
     */
    public static void stopTimer(final String key) {
        Client.instance().stopTimer(key);
    }

    /**
     *
     */
    public static void saveBinary(final String path, final Iterable<String> cases) {
        Client.instance().saveJson(path, cases);
    }

    /**
     *
     */
    public static void saveBinary(final String path) {
        Touca.saveBinary(path, new ArrayList<String>());
    }

    /**
     *
     */
    public static void saveJson(final String key, final Iterable<String> cases) {
        Client.instance().saveJson(key, cases);
    }

    /**
     *
     */
    public static void saveJson(final String key) {
        Client.instance().saveJson(key, new ArrayList<String>());
    }

    /**
     *
     */
    public static void scopedTimer(final String key, final Runnable callback) {
        try (ScopedTimer timer = new ScopedTimer("calculate_gpa")) {
            callback.run();
        }
    }

    /**
     *
     */
    public static <T> void addSerializer(final Class<T> type, Client.SerializerCallback<T> callback) {
        Client.instance().addSerializer(type, callback);
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
    public static void workflow(final String name, final Workflow workflow) {
    }

    /**
     *
     */
    public static void run(String[] args) {
    }

    /**
     *
     */
    public interface Callback {
        void configure(Options options);
    }

    /**
     *
     */
    public interface Workflow {
        void run(final String testcase);
    }
}
