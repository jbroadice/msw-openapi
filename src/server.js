"use strict";
exports.__esModule = true;
exports.server = void 0;
var node_1 = require("msw/node");
var utils_1 = require("./utils");
// This configures a request mocking server with the given request handlers.
exports.server = node_1.setupServer.apply(void 0, (0, utils_1.makeMswHandlersFromOpenApiSchema)('./@johnsonmatthey/Methanol-API-Schema/reference/Methanol.v1.yaml'));
