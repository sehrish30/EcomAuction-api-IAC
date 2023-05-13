"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema = {
    type: "object",
    properties: {
        queryStringParameters: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["OPEN", "CLOSED"],
                    default: "OPEN",
                },
            },
            required: ["status"],
        },
    },
    // array of required properties in our schema that besically must be defined
    required: ["queryStringParameters"],
};
exports.default = schema;
//# sourceMappingURL=getAuctionsSchema.js.map