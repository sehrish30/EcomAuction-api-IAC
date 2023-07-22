"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphqlHandler = void 0;
const auth_1 = require("./helpers/auth");
const express_1 = __importDefault(require("express"));
const aws_lambda_1 = require("@as-integrations/aws-lambda");
const http_1 = require("http");
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const cloudinary_1 = __importDefault(require("cloudinary"));
const body_parser_1 = __importDefault(require("body-parser"));
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const index_1 = require("./types/index");
const index_2 = require("./resolvers/index");
const dotenv_1 = __importDefault(require("dotenv"));
const connectToDb_1 = __importDefault(require("./connectToDb"));
dotenv_1.default.config();
const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: index_1.typeDefs, resolvers: index_2.resolvers });
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Create an Express app and HTTP server; we will attach both the WebSocket
// server and the ApolloServer to this HTTP server.
const app = (0, express_1.default)();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
//  set up both the HTTP and subscription servers,
const httpServer = (0, http_1.createServer)(app);
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
const wsServer = new ws_1.WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: "/graphql",
});
const getDynamicContext = async (ctx, msg, args) => {
    if (ctx.connectionParams.authentication) {
        const user = await (0, auth_1.authCheck)(ctx.connectionParams.authentication);
        return { user };
    }
    // Let the resolvers know we don't have a current user so they can
    // throw the appropriate error
    return { user: null };
};
// Save the returned server's info so we can shutdown this server later
const serverCleanup = (0, ws_2.useServer)({
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
        const unvalidToken = await (0, auth_1.tokenIsNotValid)(ctx.connectionParams.authentication);
        if (unvalidToken) {
            // You can return false to close the connection  or throw an explicit error
            // Returning false from the callback will terminate the socket by dispatching th
            console.log("SOCKET CONECTION NOT MADE");
            return false;
        }
        else {
            // Returning true or nothing from the callback will allow the client to connect.
            console.log("SOCKET CONECTION MADE");
            return true;
        }
    },
}, wsServer);
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
/**
 * We can pass this schema object to both the subscription server and ApolloServer.
 * This way, we make sure that the same schema is being used in both places.
 */
const server = new server_1.ApolloServer({
    schema,
    /**
     * Add plugins to your ApolloServer constructor to shutdown
     * both the HTTP server and the WebSocketServer:
     */
    plugins: [
        // Proper shutdown for the HTTP server.
        (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
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
    app.use("/graphql", 
    // cors<cors.CorsRequest>({
    //   // origin: "http://localhost:5173",
    // }),
    body_parser_1.default.json({ limit: "5mb" }), 
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    (0, express4_1.expressMiddleware)(server, {
        // we want to pass req, res as context
        // so now in our resolvers we have access to request and response
        context: async ({ req, res }) => ({
            token: req.headers.token,
            req,
            res,
        }),
    }));
    httpServer.listen({ port: 4000 }, () => {
        console.log(`🚀 Server ready at http://localhost:4000/graphql`);
    });
    app.use(body_parser_1.default.json({ limit: "5mb" }));
    // rest endpoint
    app.use("/rest", auth_1.authCheckREST, (req, res) => {
        res.json({
            data: "you hit rest endpoint",
        });
    });
    app.post("/uploadimages", auth_1.authCheckREST, (req, res) => {
        cloudinary_1.default.v2.uploader
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
            console.log(err, cloudinary_1.default);
            return res.status(500).json(err);
        });
    });
    app.post("/removeimage", (req, res) => {
        let image_id = req.body.public_id;
        cloudinary_1.default.v2.uploader
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
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//   })
// );
(0, connectToDb_1.default)();
// types
// https://stackoverflow.com/questions/67830070/graphql-apollo-server-resolvers-arguments-types
/**
 * // Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`);
});
 */
exports.graphqlHandler = (0, aws_lambda_1.startServerAndCreateLambdaHandler)(server, aws_lambda_1.handlers.createAPIGatewayProxyEventV2RequestHandler(), {
    context: async ({ event, context }) => {
        return {
            lambdaEvent: event,
            lambdaContext: context,
        };
    },
});
