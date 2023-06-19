import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// only ts files will work with serverless
import typeDefs1 from "./auth.graphql";
import typeDefsposts from "./postsType.graphql";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// going to bring all the files that belong to types directory
// const typesArray = loadFilesSync(".", {
//   extensions: ["graphql"],
// });

console.log("DIRNAME", __dirname);
const typesArray = loadFilesSync(path.join(__dirname, "*.graphql.js"));

// const typesArray = [typeDefs1, typeDefsposts];

console.log({ typesArray });
export const typeDefs = mergeTypeDefs(typesArray);
