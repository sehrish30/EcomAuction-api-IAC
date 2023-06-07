// lambda layer uncompressed size must be less than 250MB
const handler = () => {
  const error = {
    type: "CRITICAL",
    message: "Too many connections",
  };
  // all logs go to cloudwatch
  // lets stream those logs in kinesis firehouse
  // https://www.serverless.com/plugins/serverless-plugin-log-subscription
  console.log(JSON.stringify(error));

  return {
    statusCode: 200,
    body: JSON.stringify(error),
  };
};
export default handler;
