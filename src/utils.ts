import * as fs from "fs";
import * as yaml from "js-yaml";
import {
  OpenAPI3,
  ParameterObject,
  PathItemObject,
} from "openapi-typescript/dist/types";
import {
  DefaultRequestBody,
  ResponseResolver,
  rest,
  RestContext,
  RestHandler,
  RestRequest,
} from "msw";

export const httpMethods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
] as const;

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

  const responseResolver: ResponseResolver<
    RestRequest,
    RestContext,
    DefaultRequestBody
  > = (req, res, ctx) => {
    return res(ctx.status(200), ctx.json("Hello world!"));
  };

  const handlers: RestHandler[] = [];

  for (const path in schema.paths) {
    const pathObj = (schema.paths && schema.paths[path]) as PathItemObject;

    const pathTransformed =
      pathObj?.parameters && pathObj.parameters.length
        ? transformPathParams(path, pathObj.parameters as ParameterObject[])
        : path;

    for (const i in httpMethods) {
      if (!pathObj[httpMethods[i]]) {
        continue;
      }

      handlers.push(rest[httpMethods[i]](pathTransformed, responseResolver));
    }
  }

  return handlers;
}
