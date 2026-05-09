import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "./openapi.yaml",
    output: {
      mode: "split",
      target: "./generated",
      schemas: "./generated/schemas",
      client: "react-query",
      baseUrl: "/api",
      clean: true,
    },
  },
});
