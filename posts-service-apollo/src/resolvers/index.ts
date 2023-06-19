import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import url from "url";
// https://the-guild.dev/graphql/tools/docs/schema-merging

import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers } from "@graphql-tools/merge";
import posts from "./posts.resolver";
import auth from "./auth.resolver";

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
const resolversArray = [posts, auth];
console.log({ resolversArray });
// Resolvers define how to fetch the types defined in your schema.
export const resolvers = mergeResolvers(resolversArray);
