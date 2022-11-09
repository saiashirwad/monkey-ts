import readline from "readline";
import { Lexer } from "./lexer";

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
    while (lexer.readPosition < input.length) {
      let tok = lexer.nextToken();
      console.log(tok);
    }
  }
};

startRepl();
