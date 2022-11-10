import { Lexer } from "./lexer";
import { Parser } from "./parser";

const input = `
let x 5;
let y = 10;
`;

const lexer = new Lexer(input);
const parser = new Parser(lexer);

const program = parser.parse();

console.log(program.statements);
console.log(parser.errors);
