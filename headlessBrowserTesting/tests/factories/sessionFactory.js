const Keygrip = require("keygrip");
const keys = require("../../config/keys");
const Buffer = require("safe-buffer").Buffer;

const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  //  Node.js provides a safe-buffer module, which provides an API for creating buffers that are guaranteed to be safe from buffer overflows
  const sessionObject = {
    passport: {
      user: user._id.toString(),
    },
  };
  // use Buffer to turn sessionObject to string
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  // 3- sign the session object with keygrip using secret key

  // sign the actual session to generate signature
  // session= because library does it in this way
  const sig = keygrip.sign(`session=${session}`);

  console.log(session, sig);

  return {
    session,
    sig,
  };
};
