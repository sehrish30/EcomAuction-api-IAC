const schema = {
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

export default schema;
