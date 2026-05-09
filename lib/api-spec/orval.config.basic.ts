import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "./openapi.yaml",
    },
    output: {
      mode: "split",
      target: "./generated",
      client: "react-query",
      baseUrl: "/api",
      clean: true,
    },
  },
});
