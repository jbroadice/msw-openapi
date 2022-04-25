import { setupServer } from "msw/node";
import { makeMswHandlersFromOpenApiSchema } from "./utils";

// This configures a request mocking server with the given request handlers.
export const server = setupServer(
  ...makeMswHandlersFromOpenApiSchema(
    "./@johnsonmatthey/Methanol-API-Schema/reference/Methanol.v1.yaml"
  )
);
