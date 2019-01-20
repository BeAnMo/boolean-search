function BS_Engine(docs, docsLength) {
  /*	A stop list of 25 semantically non-selective words 
	which are common in Reuters-RCV1 */
  const _STOP_WORDS = {
    a: true,
    an: true,
    and: true,
    are: true,
    at: true,
    be: true,
    by: true,
    for: true,
    from: true,
    has: true,
    he: true,
    in: true,
    is: true,
    it: true,
    its: true,
    of: true,
    on: true,
    that: true,
    the: true,
    to: true,
    was: true,
    were: true,
    will: true,
    with: true
  };
  //const _RX = /[\s.*,:+!?^${}()|[\]\\0123456789]/g;
  const _RX = /\W/g;
  const _BOOLEAN_INTERSECTIONS = {
    /* [], [...X], [...X] -> [...X] */
    AND(data) {
      if (data.a1[0] === data.a2[0]) {
        return boolIntersect('add 1, advance both', data);
      } else if (data.a1[0] < data.a2[0]) {
        return boolIntersect('advance 1', data);
      } else {
        return boolIntersect('advance 2', data);
      }
    },
    OR(data) {
      if (data.a1[0] < data.a2[0]) {
        return boolIntersect('add 1, advance 1', data);
      } else if (data.a1[0] > data.a2[0]) {
        return boolIntersect('add 2, advance 2', data);
      } else if (data.a1[0] === data.a2[0]) {
        // add 1, advance both
        return boolIntersect('add 1, advance both', data);
      } else {
        if (data.a1.length === 0) {
          return boolIntersect('rest 2', data);
        } else {
          return boolIntersect('rest 1', data);
        }
      }
    },
    'AND-NOT'(data) {
      if (data.a1[0] > data.a2[0]) {
        return boolIntersect('advance 2', data);
      } else if (data.a1[0] < data.a2[0]) {
        return boolIntersect('add 1, advance 1', data);
      } else {
        return boolIntersect('advance both', data);
      }
    }
    /*'OR-NOT'({ acc, a1, a2}){
      // same as OR when comparing 2 lists?
      return this.OR({ acc, a1, a2});
    },*/
  };

  function boolIntersect(condition, { acc, a1, a2 }) {
    switch (condition) {
      case 'add 1, advance both':
        return {
          acc: acc.concat(a1[0]),
          a1: a1.slice(1),
          a2: a2.slice(1)
        };

      case 'advance 1':
        return {
          acc,
          a1: a1.slice(1),
          a2
        };

      case 'advance 2':
        return {
          acc,
          a1,
          a2: a2.slice(1)
        };

      case 'add 1, advance 1':
        return {
          acc: acc.concat(a1[0]),
          a1: a1.slice(1),
          a2
        };

      case 'add 2, advance 2':
        return {
          acc: acc.concat(a2[0]),
          a1,
          a2: a2.slice(1)
        };

      case 'rest 1':
        return {
          acc: acc.concat(a2),
          a1,
          a2
        };

      case 'rest 2':
        return {
          acc: acc.concat(a1),
          a1,
          a2
        };

      default:
        return {
          // advance both
          acc,
          a1: a1.slice(1),
          a2: a2.slice(1)
        };
    }
  }

  /* String, Index, Dictionary -> */
  function evalBooleanExpr(str, index) {
    const tokens = lexer(str);

    return evalTree(shuntParser(tokens), index, _BOOLEAN_INTERSECTIONS);
  }

  /* {...Term: Number}, [...String] -> {...Term: Number 
	counts the frequency of Terms in an array of Tokens */
  function FrequencyIndex(index, tokens) {
    const keyPresent = (o, k) => o[k] + 1;
    const keyAbsent = (o, k) => 1;

    return assignArrayValsToObject(index, tokens, keyPresent, keyAbsent);
  }

  /* InvertedIndex, FrequencyIndex, DocId -> InvertedIndex */
  function InvertedIndex(postList, freqIndex, id) {
    const keyPresent = (o, k) => [...o[k], id];
    const keyAbsent = (o, k) => [id];

    return assignArrayValsToObject(
      postList,
      Object.keys(freqIndex),
      keyPresent,
      keyAbsent
    );
  }

  /* Object, Array, [String, X] -> Y, [String, X] -> Z -> Object
array values are object keys, object values are dependent on valueFn */
  function assignArrayValsToObject(obj, arr, presentFn, absentFn) {
    const len = arr.length;
    let newObj = obj;

    for (let i = 0; i < len; i++) {
      const key = arr[i];

      obj[key]
        ? (newObj[key] = presentFn(obj, key))
        : (newObj[key] = absentFn(obj, key));
    }

    return newObj;
  }

  /* PostingList -> Natural */
  function countAllTokens(postList) {
    const keys = Object.keys(postList);
    const len = keys.length;
    let sum = 0;

    for (let i = 0; i < len; i++) {
      sum += postList[keys[i]].length;
    }

    return sum;
  }

  /* [...String], [...String], String -> [...String] */
  function intersect(arr1, arr2, operator) {
    const isEmpty = arr => arr.length === 0;
    const withNot = operator === 'AND-NOT' || operator === 'OR-NOT';
    const byString = (a, b) => a.localeCompare(b);
    //const shorter = arr1.length <= arr2.length ? arr1 : arr2;
    //const longer = arr1.length > arr2.length ? arr1 : arr2;

    /* 	only swap if arr2 is smaller than arr1 and
  the operator is AND or OR
const shorter = arr1.length <= arr2.length && !withNot
  ? arr2 : arr1;
const longer = arr1.length > arr2.length && !withNot
  ? arr1 : arr2; */

    let shorter;
    let longer;

    if (arr1.length <= arr2.length && withNot) {
      shorter = arr1;
      longer = arr2;
    } else if (arr1.length <= arr2.length) {
      shorter = arr1;
      longer = arr2;
    } else if (arr1.length > arr2.length && withNot) {
      shorter = arr1;
      longer = arr2;
    } else {
      shorter = arr2;
      longer = arr1;
    }

    if (!arr1 || !arr2) {
      console.log('array is undefined');
      console.log(arr1, arr2);
      return [];
    }

    let results = [];
    let a1 = shorter.slice(0).sort(byString);
    let a2 = longer.slice(0).sort(byString);

    while (a1.length > 0 || a2.length > 0) {
      if (isEmpty(a1) && withNot) {
        return [...results, ...a2];
      } else if (isEmpty(a2) && withNot) {
        return [...results, ...a1];
      } else if (isEmpty(a1) || isEmpty(a2)) {
        return results;
      } else {
        const iter = _BOOLEAN_INTERSECTIONS[operator]({ acc: results, a1, a2 });
        results = iter.acc;
        a1 = iter.a1;
        a2 = iter.a2;
      }
    }

    return results;
  }

  /* [...String], Object?, String -> [...String] */
  function multipleIntersect(terms, data, operator) {
    // do this in 1 loop?
    const withSortedTerms = term => {
      return data[term].sort(stringSort);
    };
    const byLength = (a, b) => {
      return a.length - b.length;
    };
    let sorted = terms.map(withSortedTerms).sort(byLength);

    // first
    let result = sorted[0];
    // rest
    sorted = sorted.slice(1);

    while (sorted.length !== 0 && result.length !== 0) {
      // intersect first & second - smallest arrays
      result = intersect(result, sorted[0], operator);
      sorted = sorted.slice(1);
    }

    return result;
  }

  /* [...{ id: String, summary: String}] -> Promise */
  function createInvertedIndex({ summaries, length }) {
    console.time('createInvertedIndex');
    let sums = {
      frequencyIndex: {},
      invertedIndex: {},
      wordsTotal: 0
    };

    for (let i = 0; i < length; i++) {
      const { id, summary } = summaries[i];

      sums = tokenize(sums, summary, id);
    }
    console.timeEnd('createInvertedIndex');

    return sums;
  }

  /* String, String -> Boolean */
  function stringSort(a, b) {
    return a.localeCompare(b);
  }

  /* { InvertedIndex, FrequencyIndex }, String, String -> { InvertedIndex, FrequencyIndex } 
creates an Index in about 1/3-1/5 the time */
  function tokenize(
    { invertedIndex, frequencyIndex, wordsTotal },
    summary,
    id
  ) {
    const tokens = summary.split(_RX);
    const len = tokens.length;

    let addedToPostings = {};

    for (let i = 0; i < len; i++) {
      const token = tokens[i].toLowerCase();
      // not sure if stop words are necessary

      // not empty string & not a stop word
      if (!(token === '') && !_STOP_WORDS[token]) {
        // if in freqIndex & in invertedIndex
        if (token in frequencyIndex && token in invertedIndex) {
          // if not in addedToPostings
          if (!(token in addedToPostings)) {
            frequencyIndex[token] = frequencyIndex[token] + 1;
            invertedIndex[token].push(id);
            addedToPostings[token] = true;
          } else {
            false;
          }
          // not in freqIndex or not in invertedIndex
        } else {
          invertedIndex[token] = [id];
          frequencyIndex[token] = 1;
          wordsTotal = wordsTotal + 1;
          addedToPostings[token] = true;
        }
      } else {
        false;
      }
    }

    return { invertedIndex, frequencyIndex, wordsTotal };
  }

  /*
    https://www.klittlepage.com/2013/12/22/twelve-days-2013-shunting-yard-algorithm/

    not comparing operators!!!!

    1. formal grammer
    2. lex/tokenize
    3. parse
    4. AST
  */

  /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence */
  function Operator(op) {
    if (op === null) {
      return null;
    } else if (op === undefined) {
      throw new Error('Operator is undefined');
    } else {
      const associativity = {
        NOT: { isRight: true, precedence: 16 },
        AND: { isRight: false, precedence: 6 },
        'AND-NOT': { isRight: false, precedence: 6 },
        OR: { isRight: false, precedence: 6 },
        'OR-NOT': { isRight: false, precedence: 6 },
        '(': { isRight: false, precedence: 20 },
        ')': { isRight: false, precedence: 20 }
        //'WORD': { isRight: false, precedence: 1 },
      };

      return {
        getSymbol: op,
        // if not right associative, then left associative
        isRight: associativity[op].isRight,
        comparePrecedence(a_Op) {
          // -1 if lower, 0 if even, 1 if higher
          const p1 = associativity[op].precedence;
          const p2 = associativity[a_Op].precedence;

          return p1 > p2 ? 1 : p1 === p2 ? 0 : -1;
        }
      };
    }
  }

  /* Stack, String -> Void */
  function addNode(stack, symbol, isRight) {
    if (isRight) {
      const left = stack.pop();

      return stack.push(Node(symbol, left, null));
    } else {
      const right = stack.pop();
      const left = stack.pop();

      return stack.push(Node(symbol, left, right));
    }
  }

  /* [...String] -> Tree 
  takes in tokenized collection */
  function shuntParser(tokens) {
    const operators = ['AND', 'OR', 'NOT', 'AND-NOT', 'OR-NOT'].reduce(
      byOperator,
      {}
    );

    const tree = infixToTree(tokens, operators);
    //console.log(tree)
    return tree;
  }

  function byOperator(acc, op) {
    return Object.assign(acc, { [op]: Operator(op) });
  }

  /* [...String] -> Tree */
  function infixToTree(tokens, operators) {
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
            const popped = Operator(operatorStack.pop());
            // looking for matching paren
            if (!(popped.getSymbol === '(')) {
              addNode(operandStack, popped.getSymbol, popped.isRight);
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

                addNode(operandStack, op2.getSymbol, op2.isRight);
              } else {
                break;
              }
            }
            operatorStack.push(token);
          } else {
            operandStack.push(Node(token, null, null));
          }
          break;
      }
    }

    while (!operatorStack.isEmpty()) {
      const op = Operator(operatorStack.pop());
      addNode(operandStack, op.getSymbol, op.isRight);
    }

    return operandStack.pop();
  }

  const { Stack } = (() => {
    function ArrStruct() {
      // if struct is empty, return null
      this.struct = null;

      this.get = function() {
        return this.struct;
      };

      this.set = function(newArr) {
        return (this.struct = newArr);
      };

      this.pop = function() {
        const self = this.struct;

        if (self === null) {
          return null;
        } else {
          const first = this.struct[0];
          const rest = this.struct.slice(1);

          rest.length === 0 ? this.set(null) : this.set(rest);

          return first;
        }
      };

      this.isEmpty = function() {
        return this.struct === null;
      };

      /* get first value, without modifying stack */
      this.peek = function() {
        const self = this.struct;

        return self === null ? self : self[0];
      };
    }

    function Stack() {
      ArrStruct.call(this);
    }

    Stack.prototype = {
      push(item) {
        return this.struct === null
          ? this.set([item])
          : this.set([item, ...this.struct]);
      }
    };

    return {
      Stack
    };
  })();

  /*** TREE ***/
  /* X, Tree|null, Tree|null -> Tree */
  function Node(value, left, right) {
    return { value, left, right };
  }

  /* Tree, Index, Object -> [...String] */
  function evalTree(tree, index, operatorsDict) {
    if (tree.left === null && tree.right === null) {
      return index[tree.value];
    } else {
      return intersect(
        evalTree(tree.left, index, operatorsDict),
        evalTree(tree.right, index, operatorsDict),
        tree.value
      );
    }
  }

  function lexer(str) {
    const isNotSpace = c => c !== ' ';
    const addWord = (r, w) => {
      if (word.length > 0) {
        r.push(w);
      }
    };

    const chars = str.split('').filter(c => c !== '\n');
    let result = [];
    let word = '';

    for (let i = 0; i < chars.length; i++) {
      const current = chars[i];

      if (current === '(' || current === ')') {
        addWord(result, word);
        word = '';
        result.push(current);
      } else if (isNotSpace(current)) {
        word = word + current;
      } else {
        addWord(result, word);
        word = '';
      }
    }

    addWord(result, word);

    return result;
  }

  return Object.assign(
    Object.create(null),
    createInvertedIndex({ summaries: docs, length: docsLength || docs.length }),
    { search: evalBooleanExpr }
  );
}
