import {
  Operator,
  ID,
  PossibleList,
  PreppedPair,
  OperatorParams
} from './types';

const BOOLEAN_INTERSECTIONS = (Object as any).assign(Object.create(null), {
  AND: and,
  OR: or,
  'AND-NOT': and_not
});

export function performIntersections(
  arr1: PossibleList,
  arr2: PossibleList,
  operator: Operator
): PossibleList {
  const prepped = prepForIntersect(arr1, arr2, operator);

  return prepped ? intersect(prepped as PreppedPair, operator) : [];
}

/**
 * Returns doc ids that are in both lists.
 */
function and(data: OperatorParams): OperatorParams {
  if (data.a1[0] === data.a2[0]) {
    return boolIntersect('add 1, advance both', data);
  } else if (data.a1[0] < data.a2[0]) {
    return boolIntersect('advance 1', data);
  } else {
    return boolIntersect('advance 2', data);
  }
}

/**
 * Returns doc ids that are in one list or the other.
 */
function or(data: OperatorParams): OperatorParams {
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
}

/**
 * Returns doc ids that are in the first list
 * but not in the second.
 */
function and_not(data: OperatorParams): OperatorParams {
  if (data.a1[0] > data.a2[0]) {
    return boolIntersect('advance 2', data);
  } else if (data.a1[0] < data.a2[0]) {
    return boolIntersect('add 1, advance 1', data);
  } else {
    return boolIntersect('advance both', data);
  }
}

function boolIntersect(
  condition: string,
  { acc, a1, a2 }: OperatorParams
): OperatorParams {
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

/**
 * Takes in 2 sorted Arrays and performs
 * the intersection of both based on the
 * given operator.
 */
function intersect([arr1, arr2]: PreppedPair, operator: Operator): ID[] {
  const withNot = operator === 'AND-NOT';
  let a1: ID[] = arr1;
  let a2: ID[] = arr2;

  /**
   *            empty   withNot
   * add a1     a2      T
   * add a2     a1      T
   * no add     both    F
   * both       none    F
   */
  let intersections: ID[] = [];

  while (a1[0] || a2[0]) {
    const empty1 = isEmpty(a1 as PossibleList);
    const empty2 = isEmpty(a2 as PossibleList);

    if (empty1 && withNot) {
      return [...intersections, ...a2];
    } else if (empty2 && withNot) {
      return [...intersections, ...a1];
    } else if (empty1 || empty2) {
      return intersections;
    } else {
      const iter: OperatorParams = BOOLEAN_INTERSECTIONS[operator]({
        acc: intersections,
        a1,
        a2
      });
      intersections = iter.acc;
      a1 = iter.a1;
      a2 = iter.a2;
    }
  }
  return intersections;
}

/**
 * Determines the order for intersection between
 * to Arrays depending on the length and whether
 * the operator uses "NOT". Returns a pair
 * of sorted Arrays.
 */
function prepForIntersect(
  arr1: PossibleList,
  arr2: PossibleList,
  operator: Operator
): PreppedPair | null {
  if (!arr1 || !arr2) {
    return null;
  } else {
    /**
     *              L1 <= L2    usesNot
     * [A1, A2]     T           T
     * [A1, A2]     F           T
     * [A1, A2]     T           F
     * [A2, A1]     F           F
     */
    return sortLists(
      arr1.length > arr2.length && operator !== 'AND-NOT'
        ? [arr2, arr1]
        : [arr1, arr2]
    );
  }
}

function sortLists([arr1, arr2]: PreppedPair): PreppedPair {
  if (typeof arr1[0] === 'string') {
    return [
      (arr1 as string[]).sort(byString),
      (arr2 as string[]).sort(byString)
    ];
  } else {
    return [
      (arr1 as number[]).sort(byNumber),
      (arr2 as number[]).sort(byNumber)
    ];
  }
}

function byString(a: string, b: string): number {
  return a.localeCompare(b);
}

function byNumber(a: number, b: number): number {
  return a - b;
}

function isEmpty(arr: PossibleList): boolean {
  if (!arr) {
    return false;
  } else {
    const first = arr[0] as any;

    return !first && first !== 0 && first !== false && first !== null;
  }
}

////
/* [...String], [...String], String -> [...String] */
/*function original_intersect(arr1, arr2, operator) {
  const isEmpty = arr => arr.length === 0;
  const withNot = operator === 'AND-NOT' || operator === 'OR-NOT';
  const byString = (a, b) => a.localeCompare(b);

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
      const iter = BOOLEAN_INTERSECTIONS[operator]({ acc: results, a1, a2 });
      results = iter.acc;
      a1 = iter.a1;
      a2 = iter.a2;
    }
  }

  return results;
}
*/
