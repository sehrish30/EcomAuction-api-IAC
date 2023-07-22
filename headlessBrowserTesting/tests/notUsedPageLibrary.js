const Page = require("puppeteer/lib/Page");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

// take a default class of library and add a function to it or override exisitng ones
// did this for caching
// this is called monkey patch

Page.prototype.login = async () => {
  const user = userFactory();
  const { session, sig } = sessionFactory(user);

  await this.setCookie({ name: "session", value: session });
  await this.setCookie({
    name: "session.sig",
    value: sig,
  });
  await this.goto("http://localhost:3000");
  await this.waitFor('a[href="/auth/logout"]');
};
