const schema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        body: {
          type: "string",
        },
      },
      required: ["title"],
    },
  },
  required: ["body"],
};

export default schema;
