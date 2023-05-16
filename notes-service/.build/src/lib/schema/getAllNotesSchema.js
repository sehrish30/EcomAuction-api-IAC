"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema = {
    type: "object",
    properties: {
        queryStringParameters: {
            type: "object",
            properties: {
                pageSize: {
                    type: "string",
                    default: "10",
                },
                LastEvaluatedKey: {
                    type: "string",
                },
            },
            required: ["pageSize"],
        },
    },
    required: ["queryStringParameters"],
};
exports.default = schema;
//# sourceMappingURL=getAllNotesSchema.js.map