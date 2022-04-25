"use strict";
exports.__esModule = true;
exports.makeMswHandlersFromOpenApiSchema = exports.transformPathParams = exports.parseOpenApiSchema = exports.httpMethods = void 0;
var fs = require("fs");
var yaml = require("js-yaml");
var msw_1 = require("msw");
exports.httpMethods = ["get", "put", "post", "delete", "options", "head", "patch"];
function parseOpenApiSchema(yamlFilePath) {
    return yaml.load(fs.readFileSync(yamlFilePath, 'utf8'));
}
exports.parseOpenApiSchema = parseOpenApiSchema;
function transformPathParams(path, paramsSpec) {
    var newPath = path;
    paramsSpec
        .filter(function (v) { return v["in"] === 'path'; })
        .map(function (v) { return ["{".concat(v.name, "}"), ":".concat(v.name)]; })
        .forEach(function (_a) {
        var a = _a[0], b = _a[1];
        return newPath = newPath.replace(a, b);
    });
    return newPath;
}
exports.transformPathParams = transformPathParams;
;
function makeMswHandlersFromOpenApiSchema(yamlFilePath) {
    var schema = parseOpenApiSchema(yamlFilePath);
    if (!schema.paths) {
        return [];
    }
    var handlers = [];
    for (var path in schema.paths) {
        var pathObj = (schema.paths && schema.paths[path]);
        var pathTransformed = (pathObj === null || pathObj === void 0 ? void 0 : pathObj.parameters) && pathObj.parameters.length
            ? transformPathParams(path, pathObj.parameters)
            : path;
        for (var i in exports.httpMethods) {
            if (!pathObj[exports.httpMethods[i]]) {
                continue;
            }
            handlers.push(msw_1.rest[exports.httpMethods[i]](pathTransformed, function (req, res, ctx) {
                return res(ctx.status(200), ctx.json('Hello world!'));
            }));
        }
    }
    return handlers;
}
exports.makeMswHandlersFromOpenApiSchema = makeMswHandlersFromOpenApiSchema;
