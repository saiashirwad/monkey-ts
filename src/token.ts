import { objectKeys, ValueOf } from "./utils";

export const SingleCharTokens = {
  "=": "ASSIGN",
  "+": "PLUS",
  "-": "MINUS",
  "!": "BANG",
  "*": "ASTERIX",
  "/": "SLASH",
  "<": "LT",
  ">": "GT",
  ",": "COMMA",
  ";": "SEMICOLON",
  "(": "LPAREN",
  ")": "RPAREN",
  "{": "LBRACE",
  "}": "RBRACE",
} as const;
export type SingleCharToken = keyof typeof SingleCharTokens;
export type SingleCharTokenType = ValueOf<typeof SingleCharTokens>;

export const DoubleCharTokens = {
  "==": "EQ",
  "!=": "NOT_EQ",
} as const;
export type DoubleCharToken = keyof typeof DoubleCharTokens;

export const Keywords = {
  fn: "FUNCTION",
  let: "LET",
  true: "TRUE",
  false: "FALSE",
  if: "IF",
  else: "ELSE",
  return: "RETURN",
} as const;
type Keyword = ValueOf<typeof Keywords>;

export type TokenType =
  | ValueOf<typeof SingleCharTokens>
  | ValueOf<typeof DoubleCharTokens>
  | Keyword
  | "ILLEGAL"
  | "INT"
  | "IDENT"
  | "EOF";

export const isSingleCharToken = (ch: string): ch is SingleCharToken => {
  return objectKeys(SingleCharTokens).includes(ch as any); // TODO !!??
};

export const isDoubleCharToken = (ch: string): ch is DoubleCharToken => {
  return objectKeys(DoubleCharTokens).includes(ch as any);
};

export const isKeyword = (str: string): str is keyof typeof Keywords =>
  objectKeys(Keywords).includes(str as any);

export const lookupIdentifier = (ident: string) => {
  return isKeyword(ident) ? Keywords[ident] : undefined;
};

export type Token = {
  type: TokenType;
  literal: string;
};
