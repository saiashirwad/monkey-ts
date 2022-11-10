import { Token } from "./token";

export class Program {
  statements: Statement[] = [];

  constructor() {}
}

// Expressions

export type IntegerLiteralExpression = {
  type: "integer";
  token: Token;
  value: number;
};

export type PrefixExpression = {
  type: "prefix";
  token: Token;
  operator: string;
  right: Expression;
};

export type InfixExpression = {
  type: "infix";
  token: Token;
  left: Expression;
  operator: string;
  right: Expression;
};

export type IdentifierExpression = {
  type: "identifier";
  token: Token;
  value: string;
};

export type BooleanExpression = {
  type: "boolean";
  token: Token;
  value: boolean;
};

export type IfExpression = {
  type: "if";
  token: Token;
  condition: Expression;
  consequence: BlockStatement;
  alternative?: BlockStatement;
};

export type FunctionLiteralExpression = {
  type: "function";
  token: Token;
  parameters: IdentifierExpression[];
  body: BlockStatement;
};

export type CallExpression = {
  type: "call";
  token: Token;
  function: FunctionLiteralExpression | IdentifierExpression;
  arguments: Expression[];
};

export type Expression =
  | IdentifierExpression
  | IntegerLiteralExpression
  | PrefixExpression
  | InfixExpression
  | BooleanExpression
  | IfExpression
  | FunctionLiteralExpression
  | CallExpression;

// Statements

export type BlockStatement = {
  type: "block";
  statements: Statement[];
};

export type LetStatement = {
  type: "let";
  token: Token;
  name: IdentifierExpression;
  value?: Expression;
};

export type ReturnStatement = {
  type: "return";
  token: Token;
  returnValue: Expression;
};

export type ExpressionStatement = {
  type: "expression";
  token: Token;
  expression: Expression;
};

export type Statement = LetStatement | ReturnStatement | ExpressionStatement;
