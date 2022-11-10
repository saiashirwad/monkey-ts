import {
  Expression,
  ExpressionStatement,
  LetStatement,
  Program,
  ReturnStatement,
} from "./ast";
import { Lexer } from "./lexer";
import { SingleCharToken, Token, TokenType } from "./token";

type PrefixParseFn = () => Expression;
type InfixParseFn = (expr: Expression) => Expression;

const LOWEST = null;

enum PRECEDENCE {
  LOWEST = 1,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
}

const precedences: Record<string, PRECEDENCE> = {
  EQ: PRECEDENCE.EQUALS,
  NOT_EQ: PRECEDENCE.EQUALS,
  LT: PRECEDENCE.LESSGREATER,
  GT: PRECEDENCE.LESSGREATER,
  PLUS: PRECEDENCE.SUM,
  MINUS: PRECEDENCE.SUM,
  SLASH: PRECEDENCE.PRODUCT,
  ASTERIX: PRECEDENCE.PRODUCT,
};

export class Parser {
  lexer: Lexer;
  errors: string[] = [];
  curToken: Token;
  peekToken: Token;

  prefixParseFns: Map<TokenType, PrefixParseFn> = new Map();
  infixParseFns: Map<TokenType, InfixParseFn> = new Map();

  constructor(lexer: Lexer) {
    this.lexer = lexer;

    this.curToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();

    this.registerPrefix("IDENT", this.parseIdentifier);
    this.registerInfix("INT", this.parseIntegerLiteral);
    this.registerPrefix("BANG", this.parsePrefixExpression);
    this.registerPrefix("MINUS", this.parsePrefixExpression);
  }

  parsePrefixExpression(): Expression {
    const token = this.curToken;
    const operator = this.curToken.literal;
    this.nextToken();
    return { token, operator, right: this.parseExpression(PRECEDENCE.PREFIX) };
  }

  registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn);
  }

  registerInfix(tokenType: TokenType, fn: InfixParseFn) {
    this.infixParseFns.set(tokenType, fn);
  }

  nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parse() {
    const program = new Program();
    while (this.curToken.type !== "EOF") {
      const statement = this.parseStatement();
      if (statement) {
        program.statements.push(statement);
      }
      this.nextToken();
    }

    return program;
  }

  parseStatement() {
    switch (this.curToken.type) {
      case "LET":
        return this.parseLetStatement();
      case "RETURN":
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseLetStatement(): LetStatement | undefined {
    const token = this.curToken;
    if (!this.expectPeek("IDENT")) return undefined;
    const name = { token: this.curToken, value: this.curToken.literal };
    if (!this.expectPeek("ASSIGN")) return undefined;
    while (!this.curTokenIs("SEMICOLON")) this.nextToken();
    return { type: "LET", token, name, value: undefined };
  }

  parseReturnStatement(): ReturnStatement | undefined {
    const token = this.curToken;
    this.nextToken();
    while (!this.curTokenIs("SEMICOLON")) this.nextToken();
    return { type: "RETURN", token, returnValue: undefined };
  }

  parseExpressionStatement(): ExpressionStatement | undefined {
    const token = this.curToken;
    const expression = this.parseExpression(PRECEDENCE.LOWEST);
    if (this.peekTokenIs("SEMICOLON")) {
      this.nextToken();
    }
    return { type: "EXPRESSION", token, expression };
  }

  parseExpression(precedence: number): Expression | undefined {
    const prefix = this.prefixParseFns.get(this.curToken.type);
    if (!prefix) {
      this.errors.push(
        `No prefix parse function for ${this.curToken.type} found`
      );
      return undefined;
    }
    const leftExp = prefix();
    return leftExp;
  }

  curTokenIs(t: TokenType) {
    return this.curToken.type === t;
  }

  peekTokenIs(t: TokenType) {
    return this.peekToken.type === t;
  }

  expectPeek(t: TokenType) {
    if (this.peekTokenIs(t)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(t);
      return false;
    }
  }

  peekError(t: TokenType) {
    this.errors.push(
      `Expected next token to be ${t}, got ${this.peekToken.type} instead`
    );
  }

  parseIdentifier(): Expression {
    return { token: this.curToken, value: this.curToken.literal };
  }

  parseIntegerLiteral(): Expression {
    try {
      const token = this.curToken;
      const value = parseInt(this.curToken.literal);
      return { token, value };
    } catch (e) {
      this.errors.push(`Could not parse ${this.curToken.literal} as integer`);
    }
  }
}
