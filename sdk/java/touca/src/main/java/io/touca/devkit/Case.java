// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

import io.touca.types.ArrayType;
import io.touca.types.ToucaType;
import io.touca.types.NumberType;

public class Case {
    private boolean posted = false;
    private Metadata meta;
    private Map<String, ResultEntry> resultsMap = new HashMap<String, ResultEntry>();
    private Map<String, Long> tics = new HashMap<String, Long>();
    private Map<String, Long> tocs = new HashMap<String, Long>();

    public Case(final Consumer<Metadata> meta) {
        meta.accept(this.meta);
    }

    public static final class Metadata {
        public LocalDateTime builtAt;
        public String testCase;
        public String testSuite;
        public String teamSlug;
        public String version;
    }

    public void tic(final String key) {
        tics.put(key, Instant.now().toEpochMilli());
        posted = false;
    }

    public void toc(final String key) {
        if (!tics.containsKey(key)) {
            throw new IllegalArgumentException("timer was never started for given key");
        }
        tocs.put(key, Instant.now().toEpochMilli());
        posted = false;
    }

    public void addResult(final String key, final ToucaType value) {
        resultsMap.put(key, new ResultEntry(value, ResultEntry.ResultCategory.Check));
        posted = false;
    }

    public void addAssertion(final String key, final ToucaType value) {
        resultsMap.put(key, new ResultEntry(value, ResultEntry.ResultCategory.Assert));
        posted = false;
    }

    public void addArrayElement(final String key, final ToucaType element) {
        if (!resultsMap.containsKey(key)) {
            ArrayType value = new ArrayType();
            value.add(element);
            resultsMap.put(key, new ResultEntry(value, ResultEntry.ResultCategory.Check));
            return;
        }
        ResultEntry ivalue = resultsMap.get(key);
        if (ivalue.value.type() != ToucaType.Types.Array) {
            throw new IllegalArgumentException("specified key is associated with a result of a different type");
        }
        ArrayType value = (ArrayType) ivalue.value;
        value.add(element);
        resultsMap.get(key).value = value;
        posted = false;
    }

    public void addHitCount(final String key) {
        if (!resultsMap.containsKey(key)) {
            NumberType value = new NumberType(1);
            resultsMap.put(key, new ResultEntry(value, ResultEntry.ResultCategory.Check));
            return;
        }
        ResultEntry ivalue = resultsMap.get(key);
        if (ivalue.value.type() != ToucaType.Types.Number) {
            throw new IllegalArgumentException("specified key is associated with a result of a different type");
        }
        NumberType value = (NumberType) ivalue.value;
        value.increment();
    }

    public void addMetric(final String key, final Long milliseconds) {
        tics.put(key, 0l);
        tocs.put(key, milliseconds);
        posted = false;
    }

    public void clear() {
        this.posted = false;
        this.resultsMap.clear();
        this.tics.clear();
        this.tocs.clear();
    }
}
