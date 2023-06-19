import { authCheck, authCheckREST, tokenIsNotValid } from "./helpers/auth";
import express from "express";
import morgan from "morgan";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";

import { createServer } from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cloudinary from "cloudinary";
import cors from "cors";
import bodyParser from "body-parser";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import { typeDefs } from "./types/index";
import { resolvers } from "./resolvers/index";
import dotenv from "dotenv";
import connectToDb from "./connectToDb";

dotenv.config();

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
//  set up both the HTTP and subscription servers,
const httpServer = createServer(app);

// graphql server
// types query/mutation/subscription

// Adding #graphql to the beginning of a template literal provides GraphQL syntax highlighting in supporting IDEs
// const typeDefs = `#graphql
//   # The "Query" type is special: it lists all of the available queries that
//   # clients can execute, along with the return type for each
//   type Query {
//     totalPosts: Int!
//   }
// `;

// Create our WebSocket server using the HTTP server we just set up.
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: "/graphql",
});

const getDynamicContext = async (ctx, msg, args) => {
  if (ctx.connectionParams.authentication) {
    const user = await authCheck(ctx.connectionParams.authentication);
    return { user };
  }
  // Let the resolvers know we don't have a current user so they can
  // throw the appropriate error
  return { user: null };
};

// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer(
  {
    schema,
    // useServer.context function returns an object, contextValue, which is available to your resolvers.
    // context option is called once per subscription request, not once per event emission
    context: async (ctx, msg, args) => {
      // This will be run every time the client sends a subscription request
      return getDynamicContext(ctx, msg, args);
    },
    onDisconnect(ctx, code, reason) {
      console.log("Disconnected!", reason);
    },
    onConnect: async (ctx) => {
      // pass authentication in graphql apollo headers
      // console.log("SOCKET CONECTION", ctx.connectionParams.authentication);
      // Check authentication every time a client connects.
      const unvalidToken = await tokenIsNotValid(
        ctx.connectionParams.authentication as string
      );
      if (unvalidToken) {
        // You can return false to close the connection  or throw an explicit error
        // Returning false from the callback will terminate the socket by dispatching th
        console.log("SOCKET CONECTION NOT MADE");
        return false;
      } else {
        // Returning true or nothing from the callback will allow the client to connect.
        console.log("SOCKET CONECTION MADE");
        return true;
      }
    },
  },
  wsServer
);

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
/**
 * We can pass this schema object to both the subscription server and ApolloServer.
 * This way, we make sure that the same schema is being used in both places.
 */
const server = new ApolloServer({
  schema,
  /**
   * Add plugins to your ApolloServer constructor to shutdown
   * both the HTTP server and the WebSocketServer:
   */
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});
// Hand in the schema we just created and have the
// WebSocketServer start listening.
// Ensure we wait for our server to start
server.start().then(() => {
  console.log("SERVER STARTED");
  // Set up our Express middleware to handle CORS, body parsing,
  // and our expressMiddleware function.
  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: "http://localhost:5173",
    }),
    bodyParser.json({ limit: "5mb" }),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      // we want to pass req, res as context
      // so now in our resolvers we have access to request and response
      context: async ({ req, res }) => ({
        token: req.headers.token,
        req,
        res,
      }),
    })
  );
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// app.use(
//   morgan(":method :url :status :res[content-length] - :response-time ms")
// );
// morgan.token('graphql-query', (req) => {
//   const {query, variables, operationName} = req.body;
//   return `GRAPHQL: \nOperation Name: ${operationName} \nQuery: ${query} \nVariables: ${JSON.stringify(variables)}`;
// });
// app.use(bodyParser.json());
// app.use(morgan(':graphql-query'));

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(bodyParser.json({ limit: "5mb" }));

// rest endpoint
app.use("/rest", authCheckREST, (req, res) => {
  res.json({
    data: "you hit rest endpoint",
  });
});

app.post("/uploadimages", authCheckREST, (req, res) => {
  cloudinary.v2.uploader
    .upload(req.body.image, { public_id: `${Date.now()}` })
    .then((result) => {
      const data = {
        url: result.secure_url,
        public_id: result.public_id,
      };
      console.log(data);
      return res.status(200).json(data);
    })
    .catch((err) => {
      console.log(err, cloudinary);
      return res.status(500).json(err);
    });
});

app.post("/removeimage", (req, res) => {
  let image_id = req.body.public_id;
  cloudinary.v2.uploader
    .destroy(image_id)
    .then((result) => {
      console.log(result);

      res.json({
        result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        err,
      });
    });
});

connectToDb();

httpServer.listen({ port: 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
});

// types
// https://stackoverflow.com/questions/67830070/graphql-apollo-server-resolvers-arguments-types

/**
 * // Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});
 */

export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  // We will be using the Proxy V2 handler
  handlers.createAPIGatewayProxyEventV2RequestHandler()
);
