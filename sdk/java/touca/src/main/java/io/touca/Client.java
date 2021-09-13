// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

import java.util.ArrayList;

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
    public Iterable<String> getTestCases() {
        return new ArrayList<String>();
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
    public <T> void addAssertion(final String key, final T value) {
    }

    /**
     *
     */
    public <T> void addArrayElement(final String key, final T value) {
    }

    /**
     *
     */
    public void addHitCount(final String key) {
    }

    /**
     *
     */
    public void addMetric(final String key, final long milliseconds) {
    }

    /**
     *
     */
    public void startTimer(final String key) {
    }

    /**
     *
     */
    public void stopTimer(final String key) {
    }

    /**
     *
     */
    public <T> void addSerializer(final Class<T> type, SerializerCallback<T> callback) {
    }

    /**
     *
     */
    public void saveBinary(final String key, final Iterable<String> cases) {
    }

    /**
     *
     */
    public void saveJson(final String key, final Iterable<String> cases) {
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

    /**
     *
     */
    public interface SerializerCallback<T> {
        Object call(T dataType);
    }

}
