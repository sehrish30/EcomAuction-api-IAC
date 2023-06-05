// reference all modules from steps in this file
// load some data in our data environemnt so our test cases can use

let init = require("./steps/init");
let { an_authenticated_user } = require("./steps/given");
let {
  we_invoke_createNote,
  we_invoke_updateNote,
  we_invoke_deleteNote,
} = require("./steps/when");

let idToken;
describe("Given an authenicated user", () => {
  beforeAll(async () => {
    // load all variables in our env
    init();
    // user we are going to authenticate
    let user = await an_authenticated_user();
    idToken = user.AuthenticationResult.IdToken;
    console.log(idToken);
  });

  describe("wehn we invoke POST notes", () => {
    it("Should create a new note", async () => {
      const body = {
        id: "1000",
        title: "My test note",
        body: "Hello this is the note body",
      };
      let result = await we_invoke_createNote({
        idToken,
        body,
      });
      expect(result.statusCode).toEqual(201);
      expect(result.body).not.toBeNull();
    });
  });
  describe("wehn we invoke PUT /notes/:id", () => {
    it("Should create a new note", async () => {
      const noteId = "1000";
      const body = {
        title: "My updated note",
        body: "Hello this is the updated note body",
      };
      let result = await we_invoke_updateNote({
        idToken,
        body,
        noteId,
      });
      expect(result.statusCode).toEqual(200);
      expect(result.body).not.toBeNull();
    });
  });

  describe("wehn we invoke DELETE /notes/:id", () => {
    it("Should delete a new note", async () => {
      const noteId = "1000";

      let result = await we_invoke_deleteNote({
        idToken,
        noteId,
      });
      expect(result.statusCode).toEqual(200);
      expect(result.body).not.toBeNull();
    });
  });
});
