// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
    },
  },
});
