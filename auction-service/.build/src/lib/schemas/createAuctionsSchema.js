"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema = {
    type: "object",
    properties: {
        body: {
            type: "object",
            properties: {
                title: {
                    type: "string",
                },
            },
            required: ["title"],
        },
    },
    required: ["body"],
};
exports.default = schema;
//# sourceMappingURL=createAuctionsSchema.js.map