import { Token } from "./token";

export type Node = {};

export type Expression = any;

export class Program {
  statements: Statement[] = [];

  constructor() {}
}

export type Identifier = {
  token: Token;
  value: string;
};

export type IntegerLiteral = {
  token: Token;
  value: number;
};

export type LetStatement = {
  type: "LET";
  token: Token;
  name: Identifier;
  value: Expression;
};

export type ReturnStatement = {
  type: "RETURN";
  token: Token;
  returnValue: Expression;
};

export type ExpressionStatement = {
  type: "EXPRESSION";
  token: Token;
  expression: Expression;
};

export type Statement = LetStatement | ReturnStatement | ExpressionStatement;

export type PrefixExpression = {
  token: Token;
  operator: string;
  right: Expression;
};

export type InfixExpression = {
  token: Token;
  left: Expression;
  operator: string;
  right: Expression;
};
