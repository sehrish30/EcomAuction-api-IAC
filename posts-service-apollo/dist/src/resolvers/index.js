"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const path_1 = __importDefault(require("path"));
// https://the-guild.dev/graphql/tools/docs/schema-merging
const load_files_1 = require("@graphql-tools/load-files");
const merge_1 = require("@graphql-tools/merge");
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// const resolversArray = loadFilesSync(path.join(__dirname, "*.resolver.ts"));
// const resolversArray = loadFilesSync(path.join(__dirname, "*/.resolver.js"), {
//   extensions: ["ts"],
// });
// const resolversArray = loadFilesSync(`${__dirname}/**/*.js`, {
//   ignoreIndex: true,
//   requireMethod: async (path: string) => {
//     return await import(url.pathToFileURL(path).toString());
//   },
// });
// const resolversArray = loadFilesSync(`.`, {
//   ignoreIndex: true,
//   requireMethod: async (path) => {
//     return await import(url.pathToFileURL(path));
//   },
// });
// const loadedResolvers = loadFilesSync(
//     `${__dirname}/**/*.{resolvers}.js`,
//     {
//       ignoreIndex: true,
//       requireMethod: async path => {
//         return await import(url.pathToFileURL(path));
//       },
//     }
// const resolversArray = [posts, auth];
const resolversArray = (0, load_files_1.loadFilesSync)(path_1.default.join(__dirname, "*.resolver.js"));
console.log({ resolversArray });
// Resolvers define how to fetch the types defined in your schema.
exports.resolvers = (0, merge_1.mergeResolvers)(resolversArray);
