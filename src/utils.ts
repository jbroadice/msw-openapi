import * as fs from "fs";
import * as yaml from "js-yaml";
import {
  HeaderObject,
  LinkObject,
  OpenAPI3,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  SchemaObject,
} from "openapi-typescript/dist/types";
import {
  DefaultRequestBody,
  ResponseResolver,
  rest,
  RestContext,
  RestHandler,
  RestRequest,
} from "msw";
import escapeRegExp from "lodash/escapeRegExp";

export const httpMethods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
] as const;

declare type RestHandlerMethod = string | RegExp;

export interface ResponseObject {
  description?: string;
  headers?: Record<string, ReferenceObject | HeaderObject>;
  schema?: ReferenceObject | SchemaObject;
  links?: Record<string, ReferenceObject | LinkObject>;
  content?: {
    [contentType: string]: {
      schema: ReferenceObject | SchemaObject;
      examples: {
        [exampleId: string]: {
          value: unknown;
        };
      };
    };
  };
}

export const MOCK_API_BASE_URL = "http://mymock.api";

export function parseOpenApiSchema(yamlFilePath: string) {
  return yaml.load(fs.readFileSync(yamlFilePath, "utf8")) as OpenAPI3;
}

export function transformPathParams(
  path: string,
  paramsSpec: ParameterObject[]
) {
  let newPath = path;

  paramsSpec
    .filter((v) => v.in === "path")
    .map((v) => [`{${v.name}}`, `:${v.name}`])
    .forEach(([a, b]) => (newPath = newPath.replace(a, b)));

  return newPath;
}

export function makeMswHandlersFromOpenApiSchema(yamlFilePath: string) {
  const schema = parseOpenApiSchema(yamlFilePath);

  if (!schema.paths) {
    return [];
  }

  const getOperationResponses = (method: RestHandlerMethod, path: string) => {
    if (!schema.paths || !schema.paths[path]) {
      return null;
    }

    const getOperationFromMethod = () => {
      if (!schema.paths) {
        return;
      }
      const pathObj = (schema.paths && schema.paths[path]) as PathItemObject;
      switch (method.toString()) {
        case "GET":
          return pathObj.get;
        case "PUT":
          return pathObj.put;
        case "POST":
          return pathObj.post;
        case "DELETE":
          return pathObj.delete;
        case "OPTIONS":
          return pathObj.options;
        case "HEAD":
          return pathObj.head;
        case "PATCH":
          return pathObj.patch;
      }
    };

    const operation = getOperationFromMethod();

    return operation?.responses;
  };

  const handlers: RestHandler[] = [];

  const pathTransformations: Record<string, string> = {};

  const responseResolver: ResponseResolver<
    RestRequest,
    RestContext,
    DefaultRequestBody
  > = (req, res, ctx) => {
    const handler = handlers.filter((handler) => handler.test(req));

    if (!handler || !handler.length) {
      return;
    }

    const path = handler[0].info.path
      .toString()
      .replace(new RegExp(`^${escapeRegExp(MOCK_API_BASE_URL)}`), "");

    const responses = getOperationResponses(
      handler[0].info.method,
      pathTransformations[path]
    );

    const statusResponse = (responses && responses["200"]) as ResponseObject;

    let response = null;

    if (
      statusResponse &&
      statusResponse.content &&
      statusResponse.content["application/json"].examples
    ) {
      const examples = statusResponse.content["application/json"].examples;
      response = examples[Object.keys(examples)[0]].value as DefaultRequestBody;
    }

    if (response) {
      return res(ctx.status(200), ctx.json(response));
    }

    return res(ctx.status(404), ctx.json("No example response found"));
  };

  for (const path in schema.paths) {
    const pathObj = (schema.paths && schema.paths[path]) as PathItemObject;

    const pathTransformed =
      pathObj?.parameters && pathObj.parameters.length
        ? transformPathParams(path, pathObj.parameters as ParameterObject[])
        : path;

    pathTransformations[pathTransformed] = path;

    for (const i in httpMethods) {
      if (!pathObj[httpMethods[i]]) {
        continue;
      }

      const handler = rest[httpMethods[i]](
        `${MOCK_API_BASE_URL}${pathTransformed}`,
        responseResolver
      );

      handlers.push(handler);
    }
  }

  return handlers;
}
