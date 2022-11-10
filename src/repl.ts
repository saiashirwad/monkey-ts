import util from "util";
import readline from "readline";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

async function* questions(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    for (;;) {
      yield new Promise((resolve) => rl.question(query, resolve));
    }
  } finally {
    rl.close();
  }
}

export const startRepl = async () => {
  for await (const answer of questions(">")) {
    const input = answer as string;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parse();
    if (parser.errors.length > 0) {
      console.log(parser.errors.join("\n"));
    }
    console.log(util.inspect(program, false, null, true));
  }
};

startRepl();
