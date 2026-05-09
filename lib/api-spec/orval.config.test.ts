export default {
  api: {
    input: "./openapi.yaml",
    output: {
      mode: "split",
      target: "../lib/api-client-react/src/generated",
      client: "react-query",
      baseUrl: "/api",
      clean: true,
    },
  },
};
