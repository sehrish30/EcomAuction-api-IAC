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
                id: {
                    type: "string",
                },
                body: {
                    type: "string",
                },
            },
            required: ["title", "id"],
        },
    },
    required: ["body"],
};
exports.default = schema;
//# sourceMappingURL=createNoteSchema.js.map