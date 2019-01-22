/**
 * specific to boolean operations
 */
// current operators
export type Operator = 'AND' | 'OR' | 'AND-NOT' | '(' | ')';

export interface OperatorObject {
  getSymbol: Operator;
  isRight: boolean;
  comparePrecedence: (a_Op: Operator) => number;
}

export type OperatorParams = { acc: ID[]; a1: ID[]; a2: ID[] };

// document ID
export type ID = string | number;

export type PreppedPair = [ID[], ID[]];

/**
 * general purpose
 */
export type Empty = [] | undefined;

export type PossibleList = Empty | any[];

export interface Dict {
  [key: string]: any;
}

export type Tree = TreeNode | null;

export interface TreeNode {
  value: any | null;
  left: Tree;
  right: Tree;
}

/* Stack */
export type StackList = any[] | null;

export interface StackObject {
  get: () => StackList;
  set: (items: any[]) => StackObject;
  push: (item: any) => StackObject;
  pop: () => any | null;
  peek: () => any | null;
}
