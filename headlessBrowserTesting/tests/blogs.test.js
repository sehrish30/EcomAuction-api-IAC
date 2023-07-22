const Page = require("./helpers/page");
// tests in 2 or more files run parallel

let page;

console.log("BLOGS TESTS");

beforeEach(async () => {
  // creates a new browser window
  page = await Page.build();

  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await page.close();
});

describe("When logged in", () => {
  // only for this describe
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("can see blog create form", async () => {
    const label = await page.getContentsOf("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("And using valid inputs", () => {
    beforeEach(async () => {
      await page.type(".title input", "T");
      await page.type(".content input", "C");
      await page.click("form button");
    });

    test("Submitting takes user to review screen", async () => {
      const text = await page.getContentsOf("h5");

      expect(text).toEqual("Please confirm your entries");
    });

    test("Submitting then saving adds blog to index page", async () => {
      await page.waitForSelector("button.green");
      await page.click("button.green");

      await page.waitForSelector(".card-title");
      const title = await page.getContentsOf(".card-title");
      const content = await page.getContentsOf("p");

      expect(title).toEqual("T");
      expect(content).toEqual("C");
    });
  });

  describe("And using invalid inputs", () => {
    beforeEach(async () => {
      await page.waitForSelector("form button");
      await page.click("form button");
    });

    test("the form shows an error message", async () => {
      await page.getContentsOf(".title .red-text");
      await page.getContentsOf(".content .red-text");

      const titleError = await page.getContentsOf(".title .red-text");
      const contentError = await page.getContentsOf(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});

describe("User isnot logged in", () => {
  const actions = [
    {
      method: "get",
      path: "/api/blogs",
    },
    {
      method: "post",
      path: "/api/blogs",
      data: {
        title: "T",
        content: "C",
      },
    },
  ];

  // test("Blog related actions are prohibited", async () => {
  //   const results = await page.execRequests(actions);

  //   for (let result of results) {
  //     expect(result).toEqual({
  //       error: "You must log in!",
  //     });
  //   }
  // });

  // test("User cannot create blog posts", async () => {
  //   const result = await page.post("/api/blogs", {
  //     title: "T",
  //     content: "C",
  //   });

  //   expect(result).toEqual({
  //     error: "You must log in!",
  //   });
  // });

  test("User cannot get a list of posts", async () => {
    const result = await page.get("/api/blogs");

    expect(result).toEqual({
      error: "You must log in!",
    });
  });
});

// run the tests parallel as soon as they are in seperate files
