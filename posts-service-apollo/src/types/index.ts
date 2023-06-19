import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// @ts-ignore
import typeDefs1 from "./auth.graphql";
// @ts-ignore
import typeDefsposts from "./postsType.graphql";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// going to bring all the files that belong to types directory
// const typesArray = loadFilesSync(".", {
//   extensions: ["graphql"],
// });

const typesArray = [typeDefs1, typeDefsposts];

console.log({ typesArray });
export const typeDefs = mergeTypeDefs(typesArray);
