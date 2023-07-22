// test the header of our application
// jest test runner always looks for files with .test.js inside the dir

const puppeteer = require("puppeteer");

const Page = require("./helpers/page");

// page is proxy that has access to pupetteer page, pupetteer browser and customPage
let page;

// test.only when u want to check one in hurry

beforeEach(async () => {

  page = await Page.build();

  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  // this page is coming from custom class that has static function and proxy
  await page.close();
});

// puppeteer to create browser instance

test("Header has correct text", async () => {
  // use a DOM selector to retrieve the content of an element
  // dom selector to find logo on left side
  // selector can be used to extract the element
  const text = await page.getContentsOf("a.brand-logo");

  console.log({ text });
  expect(text).toEqual("Blogster");
});

test("Clicking login starts oauth flow", async () => {
  await page.waitForSelector(".right a");
  // click on the button
  // turn this stuff to text and communicate over chromium
  // execute the command and get response back
  await page.click(".right a");

  const url = await page.url();

  //  backslashes before the dots are used to escape . else it wont match
  expect(url).toMatch(/accounts\.google\.com/); // match accounts.google.com
});

test("When signed in, shows logout button", async () => {
  // 1 - Create page instance
  // already done before in prv tests
  await page.login();

  const text = await page.getContentsOf('a[href="/auth/logout"]');

  expect(text).toEqual("Logout");
});

/**
 * Puppeteer => Starts up chromium
 * Browser => Represents an open browser window
 * Page => Represents one individual tab
 */

/**
 * Somehow convince our server that the
 * Chromium browser is logged into the app
 * by taking a session
 *
 * 1) Server sets cookie on users browser that identifies them
 * 2) All future requests include cookie data that identifies this user
 * 3) we wont do anything with google server
 */

/**
 * Take information out of that cookie
 * by passport to identify someone inside our mongodb
 * entire idea of authentication is tied to session
 * that is stored inside the cookie
 * string returned from real authentication
 * assign it to our cookie inside of our chromium instance
 * our application will magically believe that we are signed in
 */

/**
 * TRICK COOKIE_SESSION AND PASSPORT
 * 1) Create Page instance
 * 2) Take an exiting user ID and generate a fake session object with it
 * 3) Sign the session object with keygrip
 * 4) Set the session and signature on our Page instance as cookies
 */

/**
 * Base64 Session + Cookie Signing Key
 * = B53k43lkjldjfbdksfdjsfk
 * Session Signature
 *
 * Check the session
 * Base64 session = Cookie Signing Key + Session Signature
 */

/**
 * Keygrip module to sign our session string
 * sign it cryptogtaphically
 *
 * we can use it to verify our cookie or sign it
 */

/**
 * Helper functions to generate a resource for use
 * in testing
 *
 * Factory is a function to generate test data
 * whenever we call it, it assembles some data
 * and returns it immediately
 * so we can reuse factory functions that we might make
 * throughout our entire testing suite
 * to very easily create alot of data
 * without having to always, like, rewrite all the code
 *
 * Test Factories:
 * Session Factory: to create session
 * User Factory: to create User
 *
 * First make user from user factory
 * and then pass it to session factory
 */

/**
 * Proxy to intercept calls to both our page and customPage
 * static functions can be called without instantiating the class
 */

/**
 * CI= process to merge all code changes into a single branch
 * CI Server: Server that runs automatic checks(tests) on the codebase
 * to ensure the changes haven't broken anything
 */
