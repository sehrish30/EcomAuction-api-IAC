"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const load_files_1 = require("@graphql-tools/load-files");
const merge_1 = require("@graphql-tools/merge");
const path_1 = __importDefault(require("path"));
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// going to bring all the files that belong to types directory
// const typesArray = loadFilesSync(".", {
//   extensions: ["graphql"],
// });
console.log("DIRNAME", __dirname);
const typesArray = (0, load_files_1.loadFilesSync)(path_1.default.join(__dirname, "*.graphql.js"));
// const typesArray = [typeDefs1, typeDefsposts];
console.log({ typesArray });
exports.typeDefs = (0, merge_1.mergeTypeDefs)(typesArray);
