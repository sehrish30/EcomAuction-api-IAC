const schema = {
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

export default schema;
