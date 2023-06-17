import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// going to bring all the files that belong to types directory
const typesArray = loadFilesSync(path.join(__dirname, "."), {
  extensions: ["graphql"],
});
console.log({typesArray})
export const typeDefs = mergeTypeDefs(typesArray);
