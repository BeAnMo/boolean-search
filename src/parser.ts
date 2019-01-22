import { Operator, OperatorObject, Dict, Tree } from './types';
import Stack from './Stack';
import Branch, { addBranch } from './Tree';

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence */
const ASSOCIATIVITY = {
  NOT: { isRight: true, precedence: 16 },
  AND: { isRight: false, precedence: 6 },
  'AND-NOT': { isRight: false, precedence: 6 },
  OR: { isRight: false, precedence: 6 },
  'OR-NOT': { isRight: false, precedence: 6 },
  '(': { isRight: false, precedence: 20 },
  ')': { isRight: false, precedence: 20 }
  //'WORD': { isRight: false, precedence: 1 },
};

const CURRENT_OPERATORS = ['AND', 'OR', 'NOT', 'AND-NOT', 'OR-NOT'];

function Operator(op: Operator): OperatorObject | null {
  if (op === null) {
    return null;
  } else if (op === undefined) {
    throw new Error('Operator is undefined');
  } else {
    return {
      getSymbol: op,
      // if not right associative, then left associative
      isRight: ASSOCIATIVITY[op].isRight,
      comparePrecedence(a_Op: Operator): number {
        // -1 if lower, 0 if even, 1 if higher
        const p1 = ASSOCIATIVITY[op].precedence;
        const p2 = ASSOCIATIVITY[a_Op].precedence;

        return p1 > p2 ? 1 : p1 === p2 ? 0 : -1;
      }
    };
  }
}

function byOperator(
  previousValue: Dict,
  currentValue: Operator,
  currentIndex: number,
  array: string[]
): Dict {
  return (Object as any).assign(previousValue, {
    [currentValue]: Operator(currentValue)
  });
}

export function shuntParser(tokens: string[]): Tree {
  const operators = CURRENT_OPERATORS.reduce(byOperator, {});

  const tree = infixToTree(tokens, operators);
  //console.log(tree)
  return tree;
}

function infixToTree(tokens: string[], operators: Dict) {
  let operatorStack = new Stack();
  let operandStack = new Stack();

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];

    switch (token) {
      case ' ':
        break;

      case '(':
        operatorStack.push(token);
        break;

      case ')':
        while (!operatorStack.isEmpty()) {
          const popped = Operator(operatorStack.pop()) as OperatorObject;
          // looking for matching paren
          if (!(popped.getSymbol === '(')) {
            addBranch(operandStack, popped.getSymbol, popped.isRight);
          }
        }
        //throw new Error('Unmatched parentheses');
        break;

      default:
        if (token in operators) {
          // stack is [...String]
          const op1 = operators[token];
          // op1 & op2 are Operator
          let op2 = operators[operatorStack.peek()];

          while (!operatorStack.isEmpty() && op2) {
            // not comparing properly!!!!!!!!!
            if (!op1.isRight && op1.comparePrecedence(op2.getSymbol) <= 0) {
              operatorStack.pop(); // === op2

              addBranch(operandStack, op2.getSymbol, op2.isRight);
            } else {
              break;
            }
          }
          operatorStack.push(token);
        } else {
          operandStack.push(Branch(token, null, null));
        }
        break;
    }
  }

  while (!operatorStack.isEmpty()) {
    const op = Operator(operatorStack.pop()) as OperatorObject;

    addBranch(operandStack, op.getSymbol, op.isRight);
  }

  return operandStack.pop();
}
