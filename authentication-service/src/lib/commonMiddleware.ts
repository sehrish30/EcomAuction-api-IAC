import httpErrorHandler from "@middy/http-error-handler";
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpJSONBodyParser from "@middy/http-json-body-parser";

// each lambda defines allowed origins in each lambda functions
import httpCors from "@middy/http-cors";

const commonMiddleware = (handler: any) =>
  middy(handler).use([
    // automatically parse our stringified event body
    httpJSONBodyParser(),
    // will automatically adjust the API Gateway event objects
    // to prevent us from accidently having non existing object when
    // trying to access path parameters or query parameters
    httpEventNormalizer(),
    // handle errors smoothly
    httpErrorHandler(),
    // accept requests from all origins in the web not recommended in the frontend
    // specify specific urls both in serverless.yml and middy middleware
    httpCors(),

    /**
     * httpCors({
      origin: 'https://example.com',
      headers: 'Content-Type,Authorization,X-Api-Key',
      credientials: true
      })
     */
  ]);

// esModuleInterop in tsconfig.json to make sure kiddy works
export default commonMiddleware;
