import util from "util";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

const input = `
let x = 1 + (2 + 3) + 4;
`;

const lexer = new Lexer(input);
const parser = new Parser(lexer);

const program = parser.parse();

console.log(parser.errors);
console.log(util.inspect(program, false, null, true));
