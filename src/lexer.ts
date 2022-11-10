import {
  isKeyword,
  isSingleCharToken,
  Keywords,
  Token,
  SingleCharTokens,
  DoubleCharTokens,
  isDoubleCharToken,
} from "./token";

export class Lexer {
  input: string;
  position: number = 0;
  readPosition: number = 0;
  ch: string = "";

  constructor(input: string) {
    this.input = input;
    this.readChar();
  }

  readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = "";
    } else {
      this.ch = this.input[this.readPosition];
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  nextToken() {
    let tok: Token = { type: 'ILLEGAL', literal: '' }; // TODO: refactor to use fp-ts?
    this.skipWhitespace();

    if (isSingleCharToken(this.ch)) {
      const temp = `${this.ch}${this.peekChar()}`;
      if (isDoubleCharToken(temp)) {
        tok = { type: DoubleCharTokens[temp], literal: temp };
      } else {
        tok = { type: SingleCharTokens[this.ch], literal: this.ch };
      }
    } else if (this.ch === "") {
      // EOF
      tok = { type: "EOF", literal: "" };
    } else {
      if (isLetter(this.ch)) {
        const literal = this.readIdentifier();
        tok = {
          type: isKeyword(literal) ? Keywords[literal] : "IDENT",
          literal,
        };
        return tok;
      }
      if (isDigit(this.ch)) {
        tok = { type: "INT", literal: this.readNumber() };
        return tok;
      }
    }

    this.readChar();
    return tok;
  }

  readNumber(): string {
    const position = this.position;
    while (isDigit(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  readIdentifier(): string {
    const position = this.position;
    while (isLetter(this.ch)) {
      this.readChar();
    }
    return this.input.slice(position, this.position);
  }

  skipWhitespace() {
    while (
      this.ch == " " ||
      this.ch == "\t" ||
      this.ch == "\n" ||
      this.ch == "\r"
    ) {
      this.readChar();
    }
  }

  peekChar() {
    if (this.readPosition >= this.input.length) {
      return "";
    } else {
      return this.input[this.readPosition];
    }
  }
}

const isLetter = (ch: string) => {
  return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch == "_";
};

export const isDigit = (ch: string) => {
  return "0" <= ch && ch <= "9";
};
