package io.touca;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

public class Case {
    private boolean posted = false;
    private Metadata meta;
    private Map<String, String> resultsMap = new HashMap<String, String>();
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

    public void clear() {
        this.posted = false;
        this.resultsMap.clear();
        this.tics.clear();
        this.tocs.clear();
    }
}
