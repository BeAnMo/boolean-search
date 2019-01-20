/**
 * specific to boolean operations
 */
// current operators
export type Operator = 'AND' | 'OR' | 'AND-NOT';

// document ID
export type ID = string | number;

export type PreppedPair = [ID[], ID[]];

export type OperatorParams = { acc: ID[]; a1: ID[]; a2: ID[] };

/**
 * general purpose
 */
export type Empty = [] | undefined;

export type PossibleList = Empty | any[];
