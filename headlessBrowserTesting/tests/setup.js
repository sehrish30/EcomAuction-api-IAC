// time for the tests to run
jest.setTimeout(60000);

require("../models/User");

const mongoose = require("mongoose");
const keys = require("../config/keys");

// mongoose not want to use built in promise so it uses
// nodejs global promise
mongoose.Promise = global.Promise;

mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

afterAll(async () => {
  await mongoose.disconnect();
});

