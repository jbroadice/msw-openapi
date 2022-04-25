import { setupServer } from "msw/node";
import { makeMswHandlersFromOpenApiSchema } from "./utils";

export const METHANOL_YAML_PATH =
  "./@johnsonmatthey/Methanol-API-Schema/reference/Methanol.v1.yaml";

// This configures a request mocking server with the given request handlers.
export const server = setupServer(
  ...makeMswHandlersFromOpenApiSchema(METHANOL_YAML_PATH)
);
