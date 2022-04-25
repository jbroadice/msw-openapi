import fetch, { Response } from "node-fetch";
import { MOCK_API_BASE_URL, parseOpenApiSchema } from "./utils";
import { METHANOL_YAML_PATH } from "./server";

describe("Test all mock endpoints against snapshots", () => {
  const schema = parseOpenApiSchema(METHANOL_YAML_PATH);

  if (!schema || !schema.paths) {
    return false;
  }

  const responses = Object.keys(schema.paths).map((path) => [
    path,
    () => fetch(`${MOCK_API_BASE_URL}${path}`),
  ]);

  test.each(responses)("test %p", async (path, fetch) => {
    const response = await (fetch as () => Promise<Response>)();
    expect(await response.json()).toMatchSnapshot(path as string);
  });
});
