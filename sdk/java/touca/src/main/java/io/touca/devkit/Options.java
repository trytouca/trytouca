// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca.devkit;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import io.touca.exceptions.ConfigException;

/**
 *
 */
public final class Options {
    public String file;
    public String apiKey;
    public String apiUrl;
    public String team;
    public String suite;
    public String version;
    public Boolean offline;
    public Boolean concurrency;

    /**
    *
    */
    public Options() {
        this(options -> {
        });
    }

    /**
     *
     */
    public Options(Consumer<Options> options) {
        options.accept(this);
    }

    /**
     *
     */
    public void update(final Options incoming) {
        Options.update(this, incoming);
    }

    /**
     *
     */
    public final Map<String, String> diff(final Options options) {
        Map<String, String> entries = new HashMap<String, String>();
        return entries;
    }

    /**
     *
     */
    private static void update(final Options existing, final Options incoming) {
        applyConfigFile(incoming);
        applyArguments(existing, incoming);
        applyEnvironmentVariables(existing);
        reformatParameters(existing);
        validateOptions(existing);
    }

    /**
     *
     */
    private static void applyConfigFile(Options incoming) {
        if (incoming.file == null) {
            return;
        }
        final File configFile = new File(incoming.file);
        if (!configFile.exists() || !configFile.isFile()) {
            throw new ConfigException("config file not found");
        }
        final Gson gson = new GsonBuilder().registerTypeAdapter(Options.class, new Options.Deserializer()).create();
        final String content;
        try {
            byte[] encoded = Files.readAllBytes(configFile.toPath());
            content = new String(encoded, StandardCharsets.UTF_8);
            Options options = gson.fromJson(content, Options.class);
            Options.applyArguments(incoming, options);
        } catch (IOException ex) {
            throw new ConfigException("failed to read config file");
        } catch (JsonParseException ex) {
            throw new ConfigException("failed to parse config file");
        }
    }

    /**
     *
     */
    private static void applyEnvironmentVariables(Options existing) {
        final Map<String, Consumer<String>> options = new HashMap<String, Consumer<String>>();
        options.put("TOUCA_API_KEY", k -> existing.apiKey = k);
        options.put("TOUCA_API_URL", k -> existing.apiUrl = k);
        options.put("TOUCA_TEST_VERSION", k -> existing.version = k);
        for (final Map.Entry<String, Consumer<String>> entry : options.entrySet()) {
            final String env = System.getenv(entry.getKey());
            if (env == null || env.isEmpty()) {
                continue;
            }
            entry.getValue().accept(env);
        }
    }

    /**
     *
     */
    private static void reformatParameters(final Options existing) {
        if (existing.concurrency == null) {
            existing.concurrency = true;
        }
        if (existing.apiUrl == null) {
            return;
        }
        final String[] segments;
        try {
            if (!existing.apiUrl.startsWith("http://") && !existing.apiUrl.startsWith("https://")) {
                existing.apiUrl = "https://" + existing.apiUrl;
            }
            final URL url = new URL(existing.apiUrl);
            segments = url.getPath().split("/@/");
            String urlPath = String.join("/", Arrays.asList(segments[0].split("/")).stream().filter(x -> !x.isEmpty())
                    .collect(Collectors.toList()));
            final URI uri = new URI(url.getProtocol(), url.getAuthority(), "/" + urlPath, null, null);
            existing.apiUrl = uri.toURL().toString();
        } catch (MalformedURLException ex) {
            throw new ConfigException(String.format("api url is invalid: %s", ex.getMessage()));
        } catch (URISyntaxException ex) {
            throw new ConfigException(String.format("api url is invalid: %s", ex.getMessage()));
        }
        if (1 == segments.length) {
            return;
        }
        reformatSlugs(existing, segments[1]);
    }

    /**
     *
     */
    private static void reformatSlugs(final Options existing, final String path) {
        final String[] givenSlugs = Arrays.asList(path.split("/")).stream().filter(x -> !x.isEmpty())
                .toArray(String[]::new);
        final SlugEntry[] slugs = { new SlugEntry("team", o -> o.team, (o, k) -> o.team = k),
                new SlugEntry("suite", o -> o.suite, (o, k) -> o.suite = k),
                new SlugEntry("version", o -> o.version, (o, k) -> o.version = k) };
        for (int i = 0; i < givenSlugs.length; i++) {
            final String actual = slugs[i].getter.apply(existing);
            if (actual != null && !actual.equals(givenSlugs[i])) {
                throw new ConfigException(
                        String.format("option \"%s\" is in conflict with provided api url", slugs[i].name));
            }
            slugs[i].setter.accept(existing, givenSlugs[i]);
        }
    }

    /**
     *
     */
    private static final class SlugEntry {
        public String name;
        public Function<Options, String> getter;
        public BiConsumer<Options, String> setter;

        public SlugEntry(final String name, final Function<Options, String> getter,
                final BiConsumer<Options, String> setter) {
            this.name = name;
            this.getter = getter;
            this.setter = setter;
        }
    }

    /**
     *
     */
    private static void validateOptions(final Options existing) {
        final Map<String, Boolean> expectedKeys = new HashMap<String, Boolean>();
        expectedKeys.put("team", existing.team != null);
        expectedKeys.put("suite", existing.suite != null);
        expectedKeys.put("version", existing.version != null);
        boolean hasHandshake = existing.offline == null || existing.offline == true;
        if (hasHandshake && (existing.apiKey != null || existing.apiUrl != null)) {
            expectedKeys.put("apiKey", existing.apiKey != null);
            expectedKeys.put("apiUrl", existing.apiUrl != null);
        }
        final List<String> setKeys = filterKeys(expectedKeys, true);
        final List<String> missingKeys = filterKeys(expectedKeys, false);
        if (setKeys.isEmpty() || missingKeys.isEmpty()) {
            return;
        }
        throw new ConfigException(String.format("missing required options: %s", String.join(", ", missingKeys)));
    }

    /**
     *
     */
    private static List<String> filterKeys(final Map<String, Boolean> keys, final boolean status) {
        return keys.entrySet().stream().filter(entry -> {
            return entry.getValue() == status;
        }).map(entry -> {
            return entry.getKey();
        }).collect(Collectors.toList());
    }

    /**
     *
     */
    private static void applyArguments(final Options existing, final Options incoming) {
        if (incoming.apiKey != null) {
            existing.apiKey = incoming.apiKey;
        }
        if (incoming.apiUrl != null) {
            existing.apiUrl = incoming.apiUrl;
        }
        if (incoming.team != null) {
            existing.team = incoming.team;
        }
        if (incoming.suite != null) {
            existing.suite = incoming.suite;
        }
        if (incoming.version != null) {
            existing.version = incoming.version;
        }
        if (incoming.offline != null) {
            existing.offline = incoming.offline;
        }
        if (incoming.concurrency != null) {
            existing.concurrency = incoming.concurrency;
        }
    }

    /**
     *
     */
    public static class Deserializer implements JsonDeserializer<Options> {

        /**
         * @param json    json element to be deserialized
         * @param type    type of the json string
         * @param context context for deserialization
         * @return a new options instance that represents content of json string
         * @throws JsonParseException if it fails to parse string to activity object
         */
        @Override
        public Options deserialize(final JsonElement json, final Type type, final JsonDeserializationContext context)
                throws JsonParseException {
            final JsonObject root = json.getAsJsonObject();
            if (!root.has("touca")) {
                return new Options();
            }
            final JsonObject fileOptions = root.get("touca").getAsJsonObject();
            return new Options(options -> {
                updateStringField(fileOptions, "api_key", k -> options.apiKey = k);
                updateStringField(fileOptions, "api_url", k -> options.apiUrl = k);
                updateStringField(fileOptions, "team", k -> options.team = k);
                updateStringField(fileOptions, "suite", k -> options.suite = k);
                updateStringField(fileOptions, "version", k -> options.version = k);
                updateBooleanField(fileOptions, "offline", k -> options.offline = k);
                updateBooleanField(fileOptions, "concurrency", k -> options.concurrency = k);
            });
        }

        /**
         *
         */
        private void updateStringField(final JsonObject obj, final String key, Consumer<String> field) {
            if (!obj.has(key)) {
                return;
            }
            if (!obj.get(key).isJsonPrimitive()) {
                throw new JsonParseException("expected primitive");
            }
            if (!obj.get(key).getAsJsonPrimitive().isString()) {
                throw new JsonParseException("expected string");
            }
            field.accept(obj.get(key).getAsString());
        }

        /**
         *
         */
        private void updateBooleanField(final JsonObject obj, final String key, Consumer<Boolean> field)
                throws JsonParseException {
            if (!obj.has(key)) {
                return;
            }
            if (!obj.get(key).isJsonPrimitive()) {
                throw new JsonParseException("expected primitive");
            }
            if (!obj.get(key).getAsJsonPrimitive().isBoolean()) {
                throw new JsonParseException("expected boolean");
            }
            field.accept(obj.get(key).getAsBoolean());
        }
    }

}
