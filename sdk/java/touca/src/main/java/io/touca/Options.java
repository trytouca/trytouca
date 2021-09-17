// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

package io.touca;

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
import java.util.function.Consumer;
import java.util.stream.Collectors;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;

/**
 *
 */
public class Options {
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
    public void update(final Options incoming) throws ConfigurationException {
        applyConfigFile(incoming);
        Options.applyArguments(this, incoming);
        applyEnvironmentVariables();
        reformatParameters();
        validateOptions();
    }

    /**
     *
     */
    private void applyConfigFile(Options incoming) throws ConfigurationException {
        if (incoming.file == null) {
            return;
        }
        final File configFile = new File(incoming.file);
        if (!configFile.exists() || !configFile.isFile()) {
            throw new ConfigurationException("config file not found");
        }
        final Gson gson = new GsonBuilder().registerTypeAdapter(Options.class, new Options.Deserializer()).create();
        final String content;
        try {
            byte[] encoded = Files.readAllBytes(configFile.toPath());
            content = new String(encoded, StandardCharsets.UTF_8);
            Options options = gson.fromJson(content, Options.class);
            Options.applyArguments(incoming, options);
        } catch (IOException ex) {
            throw new ConfigurationException("failed to read config file");
        } catch (JsonParseException ex) {
            throw new ConfigurationException("failed to parse config file");
        }
    }

    /**
     *
     */
    private void applyEnvironmentVariables() {
        final Map<String, Consumer<String>> options = new HashMap<String, Consumer<String>>();
        options.put("TOUCA_API_KEY", (String k) -> this.apiKey = k);
        options.put("TOUCA_API_URL", (String k) -> this.apiUrl = k);
        options.put("TOUCA_TEST_VERSION", (String k) -> this.version = k);
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
    private void reformatParameters() {
        if (this.concurrency == null) {
            this.concurrency = true;
        }
        if (this.apiUrl == null) {
            return;
        }
        final String[] segments;
        try {
            if (!this.apiUrl.startsWith("http://") && !this.apiUrl.startsWith("https://")) {
                this.apiUrl = "https://" + this.apiUrl;
            }
            final URL url = new URL(this.apiUrl);
            segments = url.getPath().split("/@/");
            String urlPath = String.join("/", Arrays.asList(segments[0].split("/")).stream().filter(x -> !x.isEmpty())
                    .collect(Collectors.toList()));
            final URI uri = new URI(url.getProtocol(), url.getAuthority(), "/" + urlPath, null, null);
            this.apiUrl = uri.toURL().toString();
        } catch (MalformedURLException ex) {
            final String error = String.format("api url is invalid: %s", ex.getMessage());
            throw new ConfigurationException(error);
        } catch (URISyntaxException ex) {
            final String error = String.format("api url is invalid: %s", ex.getMessage());
            throw new ConfigurationException(error);
        }
        if (segments.length == 1) {
            return;
        }
        final String[] slugs = Arrays.asList(segments[1].split("/")).stream().filter(x -> !x.isEmpty())
                .toArray(String[]::new);
        if (1 <= slugs.length) {
            if (this.team != null && !this.team.equals(slugs[0])) {
                final String error = String.format("option \"%s\" is in conflict with provided api url", "team");
                throw new ConfigurationException(error);
            }
            this.team = slugs[0];
        }
        if (2 <= slugs.length) {
            if (this.suite != null && !this.suite.equals(slugs[0])) {
                final String error = String.format("option \"%s\" is in conflict with provided api url", "suite");
                throw new ConfigurationException(error);
            }
            this.suite = slugs[1];
        }
        if (3 <= slugs.length) {
            if (this.version != null && !this.version.equals(slugs[0])) {
                final String error = String.format("option \"%s\" is in conflict with provided api url", "version");
                throw new ConfigurationException(error);
            }
            this.version = slugs[2];
        }
    }

    /**
     *
     */
    private void validateOptions() {
        final Map<String, Boolean> expectedKeys = new HashMap<String, Boolean>();
        expectedKeys.put("team", this.team != null);
        expectedKeys.put("suite", this.suite != null);
        expectedKeys.put("version", this.version != null);
        boolean hasHandshake = this.offline == null || this.offline == true;
        if (hasHandshake && (this.apiKey != null || this.apiUrl != null)) {
            expectedKeys.put("apiKey", this.apiKey != null);
            expectedKeys.put("apiUrl", this.apiUrl != null);
        }
        final List<String> setKeys = filterKeys(expectedKeys, true);
        final List<String> missingKeys = filterKeys(expectedKeys, false);
        if (setKeys.isEmpty() || missingKeys.isEmpty()) {
            return;
        }
        final String error = String.format("missing required options: %s", String.join(", ", missingKeys));
        throw new ConfigurationException(error);
    }

    /**
     *
     */
    private List<String> filterKeys(final Map<String, Boolean> keys, final boolean status) {
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
            final Options options = new Options();
            if (!root.has("touca")) {
                return options;
            }
            final JsonObject fileOptions = root.get("touca").getAsJsonObject();
            updateStringField(fileOptions, "api_key", (String k) -> options.apiKey = k);
            updateStringField(fileOptions, "api_url", (String k) -> options.apiUrl = k);
            updateStringField(fileOptions, "team", (String k) -> options.team = k);
            updateStringField(fileOptions, "suite", (String k) -> options.suite = k);
            updateStringField(fileOptions, "version", (String k) -> options.version = k);
            updateBooleanField(fileOptions, "offline", (Boolean k) -> options.offline = k);
            updateBooleanField(fileOptions, "concurrency", (Boolean k) -> options.concurrency = k);
            return options;
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
