import { defineConfig } from "orval";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  api: {
    input: path.resolve(__dirname, "openapi.yaml"),
    output: {
      mode: "split",
      target: "../lib/api-client-react/src/generated",
      client: "react-query",
      baseUrl: "/api",
      clean: true,
    },
  },
  zod: {
    input: path.resolve(__dirname, "openapi.yaml"),
    output: {
      mode: "split",
      target: "../lib/api-zod/src/generated",
      client: "zod",
      schemas: "../lib/api-zod/src/generated/types",
      clean: true,
    },
  },
});
