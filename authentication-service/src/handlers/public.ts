export async function handler(event, context) {
    return {
      statusCode: 200,
      headers: {
        /* Required for CORS support to work */
        "Access-Control-Allow-Origin": "*",
        /* Required for cookies, authorization headers with HTTPS */
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Hi ⊂◉‿◉つ from Public API",
      }),
    };
  }
  /**
   * cd ..
   * serverless create --name auth-service --template-path auth0-authorizer-service
   * // Project successfully created in "./auth-service"
   * serverless deploy --stage dev
   */
  