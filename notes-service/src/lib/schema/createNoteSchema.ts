const schema = {
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

export default schema;
