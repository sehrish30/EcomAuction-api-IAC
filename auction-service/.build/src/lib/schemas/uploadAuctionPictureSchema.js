"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schema = {
    type: "object",
    properties: {
        body: {
            type: "string",
            // I cannot validate that my string is base64 string
            // not possible using json schema validation
            // best i can do is minLength 1
            minLength: 1,
            // this pattern ensures that ur string ends with equal sign
            pattern: "=$",
        },
    },
    required: ["body"],
};
exports.default = schema;
//# sourceMappingURL=uploadAuctionPictureSchema.js.map