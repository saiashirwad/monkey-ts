import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import {
  BlockStatement,
  BooleanExpression,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteralExpression,
  IdentifierExpression,
  IfExpression,
  InfixExpression,
  IntegerLiteralExpression,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
} from "./ast";
import { Lexer } from "./lexer";
import { Token, TokenType } from "./token";

type PrefixParseFn = () => Expression | undefined;
type InfixParseFn = (expr: Expression) => Expression | undefined;

enum Precedence {
  LOWEST = 1,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
}

const precedences: Record<string, Precedence> = {
  EQ: Precedence.EQUALS,
  NOT_EQ: Precedence.EQUALS,
  LT: Precedence.LESSGREATER,
  GT: Precedence.LESSGREATER,
  PLUS: Precedence.SUM,
  MINUS: Precedence.SUM,
  SLASH: Precedence.PRODUCT,
  ASTERISK: Precedence.PRODUCT,
  LPAREN: Precedence.CALL,
};

const infixOperators = [
  "PLUS",
  "MINUS",
  "SLASH",
  "ASTERISK",
  "EQ",
  "NOT_EQ",
  "LT",
  "GT",
] as const;
type InfixOperator = typeof infixOperators[number] | "LPAREN";

const isInfixOperator = (value: string): value is InfixOperator => {
  return infixOperators.includes(value as any);
};

const prefixOperators = ["BANG", "MINUS", "IDENT"] as const;

export class Parser {
  lexer: Lexer;
  errors: string[] = [];
  curToken: Token;
  peekToken: Token;

  prefixParseFns: Map<TokenType, PrefixParseFn> = new Map();
  infixParseFns: Map<InfixOperator, InfixParseFn> = new Map();

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.errors = [];

    this.curToken = this.lexer.nextToken();
    this.peekToken = this.lexer.nextToken();

    this.registerPrefix("INT", this.parseIntegerLiteral.bind(this));
    this.registerPrefix("TRUE", this.parseBooleanLiteral.bind(this));
    this.registerPrefix("FALSE", this.parseBooleanLiteral.bind(this));
    this.registerPrefix("LPAREN", this.parseGroupedExpression.bind(this));
    this.registerPrefix("IF", this.parseIfExpression.bind(this));
    this.registerPrefix("FUNCTION", this.parseFunctionLiteral.bind(this));
    prefixOperators.forEach((operator) => {
      this.registerPrefix(operator, this.parsePrefixExpression.bind(this));
    });

    this.registerInfix("LPAREN", this.parseCallExpression.bind(this));
    infixOperators.forEach((operator) => {
      this.registerInfix(operator, this.parseInfixExpresion.bind(this));
    });
  }

  parsePrefixExpression(): PrefixExpression | undefined {
    const token = this.curToken;
    const operator = this.curToken.literal;
    this.nextToken();
    const right = this.parseExpression(Precedence.PREFIX);
    if (right) {
      return { type: "prefix", token, operator, right };
    }
  }

  parseInfixExpresion(left: Expression): InfixExpression | undefined {
    const token = this.curToken;
    const operator = this.curToken.literal;
    const precedence = this.curPrecedence();
    this.nextToken();
    const right = this.parseExpression(precedence);
    if (right) {
      return { token, operator, left, right, type: "infix" };
    }
  }

  registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn);
  }

  registerInfix(tokenType: InfixOperator, fn: InfixParseFn) {
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
    if (!this.expectPeek("IDENT")) {
      this.errors.push("Expected identifier after let");
      return undefined;
    }
    const name: IdentifierExpression = {
      token: this.curToken,
      value: this.curToken.literal,
      type: "identifier",
    };
    if (!this.expectPeek("ASSIGN")) return undefined;
    this.nextToken();
    const value = this.parseExpression(Precedence.LOWEST);
    while (!this.curTokenIs("SEMICOLON")) this.nextToken();
    return { type: "let", token, name, value };
  }

  parseReturnStatement(): ReturnStatement | undefined {
    const token = this.curToken;
    this.nextToken();
    const returnValue = this.parseExpression(Precedence.LOWEST);
    while (!this.curTokenIs("SEMICOLON")) this.nextToken();
    if (returnValue) return { type: "return", token, returnValue };
  }

  parseExpressionStatement(): ExpressionStatement | undefined {
    const token = this.curToken;
    const expression = this.parseExpression(Precedence.LOWEST);
    if (this.peekTokenIs("SEMICOLON")) this.nextToken();
    if (expression) {
      return { type: "expression", token, expression };
    }
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

  parseIdentifier(): IdentifierExpression {
    return {
      type: "identifier",
      token: this.curToken,
      value: this.curToken.literal,
    };
  }

  parseBooleanLiteral(): BooleanExpression | undefined {
    return {
      type: "boolean",
      token: this.curToken,
      value: this.curTokenIs("TRUE"),
    };
  }

  parseIfExpression(): IfExpression | undefined {
    const token = this.curToken;
    let alternative: BlockStatement | undefined = undefined;
    if (!this.expectPeek("LPAREN")) return undefined;
    this.nextToken();
    const condition = this.parseExpression(Precedence.LOWEST);
    if (!condition) return undefined;
    if (!this.expectPeek("RPAREN")) return undefined;
    if (!this.expectPeek("LBRACE")) return undefined;
    const consequence = this.parseBlockStatement();
    if (!consequence) return undefined;
    if (this.peekTokenIs("ELSE")) {
      this.nextToken();
      if (!this.expectPeek("LBRACE")) return undefined;
      alternative = this.parseBlockStatement();
    }
    return { type: "if", token, condition, consequence, alternative };
  }

  parseCallExpression(fn: Expression): CallExpression | undefined {
    if (fn.type === "identifier" || fn.type === "function") {
      const args = this.parseCallArguments();
      if (args)
        return {
          type: "call",
          token: this.curToken,
          function: fn,
          arguments: args,
        };
    }
  }

  parseCallArguments(): Expression[] | undefined {
    const args: Expression[] = [];
    if (this.peekTokenIs("RPAREN")) {
      this.nextToken();
      return args;
    }
    this.nextToken();
    const exp = this.parseExpression(Precedence.LOWEST);
    if (exp) args.push(exp);

    while (this.peekTokenIs("COMMA")) {
      this.nextToken();
      this.nextToken();
      const exp = this.parseExpression(Precedence.LOWEST);
      if (exp) args.push(exp);
    }

    if (!this.expectPeek("RPAREN")) return undefined;
    return args;
  }

  parseFunctionLiteral(): FunctionLiteralExpression | undefined {
    const token = this.curToken;
    if (!this.expectPeek("LPAREN")) return undefined;
    const parameters = this.parseFunctionParameters() ?? [];
    if (!this.expectPeek("LBRACE")) return undefined;
    const body = this.parseBlockStatement();
    if (body) return { type: "function", body, parameters, token };
  }

  parseFunctionParameters(): IdentifierExpression[] | undefined {
    const identifiers: IdentifierExpression[] = [];
    if (this.peekTokenIs("RPAREN")) {
      this.nextToken();
      return identifiers;
    }
    this.nextToken();
    identifiers.push({
      type: "identifier",
      token: this.curToken,
      value: this.curToken.literal,
    });
    while (this.peekTokenIs("COMMA")) {
      this.nextToken();
      this.nextToken();
      identifiers.push({
        type: "identifier",
        token: this.curToken,
        value: this.curToken.literal,
      });
    }
    if (!this.expectPeek("RPAREN")) return undefined;
    return identifiers;
  }

  parseBlockStatement(): BlockStatement | undefined {
    const token = this.curToken;
    const statements: Statement[] = [];
    this.nextToken();
    while (!this.curTokenIs("RBRACE") && this.curTokenIs("EOF")) {
      const statement = this.parseStatement();
      if (statement) statements.push(statement);
      this.nextToken();
    }
    return { type: "block", statements };
  }

  parseGroupedExpression(): Expression | undefined {
    this.nextToken();
    const exp = this.parseExpression(Precedence.LOWEST);
    if (!this.expectPeek("RPAREN")) return undefined;
    return exp;
  }

  parseIntegerLiteral(): IntegerLiteralExpression | undefined {
    try {
      const token = this.curToken;
      const value = parseInt(token.literal);
      return { type: "integer", token, value };
    } catch (e) {
      this.errors.push(
        `Could not parse ${this.curToken.literal} as an integer`
      );
    }
  }

  peekPrecedence() {
    return precedences[this.peekToken.type] ?? Precedence.LOWEST;
  }

  curPrecedence() {
    return precedences[this.curToken.type] ?? Precedence.LOWEST;
  }

  parseExpression(precedence: number): Expression | undefined {
    const prefixFn = this.prefixParseFns.get(this.curToken.type);
    if (!prefixFn) {
      this.errors.push(
        `No prefix parse function for ${this.curToken.type} found`
      );
      return undefined;
    }
    let leftExp = prefixFn();
    while (
      !this.peekTokenIs("SEMICOLON") &&
      precedence < this.peekPrecedence()
    ) {
      if (isInfixOperator(this.peekToken.type)) {
        const infixFn = this.infixParseFns.get(this.peekToken.type);
        if (!infixFn) return leftExp;
        this.nextToken();
        if (leftExp) leftExp = infixFn(leftExp);
      }
    }
    return leftExp;
  }
}
