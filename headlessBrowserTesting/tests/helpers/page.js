const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

class CustomPage {
  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    // Refresh page

    await this.page.goto("http://localhost:3000/blogs");

    // Wait until the element appears
    await this.page.waitForSelector('a[href="/auth/logout"]');
  }

  static async build() {
    const browser = await puppeteer.launch({
      headless: "new", // false if u want to see browser and inspect it
      // tinker around settings of vm
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get: (target, property, receiver) => {
        if (target[property]) {
          return target[property];
        }

        let value = browser[property];
        if (value instanceof Function) {
          return function (...args) {
            return value.apply(this === receiver ? browser : this, args);
          };
        }

        value = page[property];
        if (value instanceof Function) {
          return function (...args) {
            return value.apply(this === receiver ? page : this, args);
          };
        }

        return value;
      },
    });
  }

  async getContentsOf(selector) {
    // await this.page.waitFor(selector);
    // make eval function clear than before
    return this.page.$eval(selector, (el) => el.innerHTML);
  }

  get(path) {
    // evaluate converts function to string and sends it to chromium instance
    // _path is passed from external functions
    return this.page.evaluate(async (_path) => {
      const res = await fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
      // path is an argmuent after function that gets passed to that function
    }, path);
  }

  post(path, data) {
    return this.page.evaluate(async (_path, _data) => {
      const result = await fetch(
        _path,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        },
        path,
        data
      );
      return await result.json();
    });
  }

  execRequests(actions) {
    // Promise.all takes all promises and combine them down
    // to one single promise
    return Promise.all(
      actions.map(({ method, path, data }) => {
        // no data is passed for get request so its fine
        this[method](path, data);
      })
    );
  }
}

module.exports = CustomPage;
